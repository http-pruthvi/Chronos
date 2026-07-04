import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateEmployeeDto, actorUserId?: string) {
    // 1. Check if email exists
    const existingEmployeeByEmail = await this.prisma.employee.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existingEmployeeByEmail) {
      throw new BadRequestException(
        'An employee with this email already exists',
      );
    }

    // 2. Check if employee code exists
    const existingEmployeeByCode = await this.prisma.employee.findFirst({
      where: { employeeCode: dto.employeeCode, deletedAt: null },
    });
    if (existingEmployeeByCode) {
      throw new BadRequestException(
        `Employee code "${dto.employeeCode}" is already assigned`,
      );
    }

    // 3. Resolve role in DB
    const roleName = (dto.role || 'EMPLOYEE').toUpperCase();
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      throw new BadRequestException(`Access role "${roleName}" is invalid`);
    }

    // 4. Validate Manager exists
    if (dto.managerId) {
      const manager = await this.employeesRepository.findById(dto.managerId);
      if (!manager) {
        throw new NotFoundException(
          `Manager with ID "${dto.managerId}" not found`,
        );
      }
    }

    // 5. Hash default password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('DemoPassword123!', salt);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Employee
      const employee = await tx.employee.create({
        data: {
          employeeCode: dto.employeeCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone || null,
          departmentId: dto.departmentId,
          designation: dto.designation,
          managerId: dto.managerId || null,
          dateOfJoining: new Date(dto.dateOfJoining),
          status: dto.status || 'ACTIVE',
        },
        include: {
          department: true,
          manager: true,
        },
      });

      // 2. Create User login credentials
      await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          roleId: role.id,
          employeeId: employee.id,
        },
      });

      // 3. Write Audit Log
      await this.auditLogsService.log(
        {
          actorUserId,
          action: 'EMPLOYEE_CREATED',
          entityType: 'Employee',
          entityId: employee.id,
          afterState: employee,
        },
        tx,
      );

      return employee;
    });
  }

  async findAll(query: {
    departmentId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Number(query.limit || 10));
    const skip = (page - 1) * limit;

    const { items, total } = await this.employeesRepository.findAll({
      departmentId: query.departmentId,
      status: query.status,
      search: query.search,
      skip,
      take: limit,
    });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.employeesRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, actorUserId?: string) {
    const employee = await this.findOne(id);

    // If email is modified, verify unique email check
    if (dto.email && dto.email !== employee.email) {
      const emailConflict = await this.prisma.employee.findFirst({
        where: { email: dto.email, deletedAt: null, NOT: { id } },
      });
      if (emailConflict) {
        throw new BadRequestException(
          'Work email is already in use by another employee',
        );
      }
    }

    // If code is modified, verify unique code check
    if (dto.employeeCode && dto.employeeCode !== employee.employeeCode) {
      const codeConflict = await this.prisma.employee.findFirst({
        where: { employeeCode: dto.employeeCode, deletedAt: null, NOT: { id } },
      });
      if (codeConflict) {
        throw new BadRequestException('Employee code is already in use');
      }
    }

    // Verify Manager hierarchy circular lock
    if (dto.managerId) {
      await this.verifyManagerChain(id, dto.managerId);
    }

    const beforeState = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: {
          employeeCode: dto.employeeCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          department: dto.departmentId
            ? { connect: { id: dto.departmentId } }
            : undefined,
          designation: dto.designation,
          manager:
            dto.managerId !== undefined
              ? dto.managerId
                ? { connect: { id: dto.managerId } }
                : { disconnect: true }
              : undefined,
          dateOfJoining: dto.dateOfJoining
            ? new Date(dto.dateOfJoining)
            : undefined,
          dateOfExit: dto.dateOfExit ? new Date(dto.dateOfExit) : undefined,
          status: dto.status,
        },
        include: {
          department: true,
          manager: true,
        },
      });

      // Update User email and status if modified
      if (dto.email || dto.status) {
        const user = await tx.user.findUnique({ where: { employeeId: id } });
        if (user) {
          await tx.user.update({
            where: { employeeId: id },
            data: {
              email: dto.email || undefined,
              isActive: dto.status ? dto.status === 'ACTIVE' : undefined,
            },
          });
        }
      }

      await this.auditLogsService.log(
        {
          actorUserId,
          action: 'EMPLOYEE_UPDATED',
          entityType: 'Employee',
          entityId: id,
          beforeState,
          afterState: updatedEmployee,
        },
        tx,
      );

      return updatedEmployee;
    });
  }

  async remove(id: string, actorUserId?: string) {
    const beforeState = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const date = new Date();
      // Soft-delete employee
      await tx.employee.update({
        where: { id },
        data: { deletedAt: date },
      });

      // Soft-delete user login
      await tx.user.update({
        where: { employeeId: id },
        data: { deletedAt: date, isActive: false },
      });

      // Write Audit Log
      await this.auditLogsService.log(
        {
          actorUserId,
          action: 'EMPLOYEE_DELETED',
          entityType: 'Employee',
          entityId: id,
          beforeState,
          afterState: { deleted: true },
        },
        tx,
      );

      return {
        success: true,
        message: 'Employee successfully offboarded and deleted',
      };
    });
  }

  private async verifyManagerChain(employeeId: string, managerId: string) {
    if (employeeId === managerId) {
      throw new BadRequestException('An employee cannot report to themselves');
    }

    let currentId = managerId;
    while (currentId) {
      const parent = await this.prisma.employee.findFirst({
        where: { id: currentId, deletedAt: null },
      });
      if (!parent) break;
      if (parent.id === employeeId) {
        throw new BadRequestException(
          `Circular manager dependency: Employee "${employeeId}" cannot report to manager "${managerId}" because it forms a loop.`,
        );
      }
      currentId = parent.managerId || '';
    }
  }
}
