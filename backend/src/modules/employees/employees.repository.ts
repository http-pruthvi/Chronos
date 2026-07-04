import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto, defaultPasswordHash: string, roleId: string) {
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
      });

      // 2. Create User login credentials
      await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: defaultPasswordHash,
          roleId,
          employeeId: employee.id,
        },
      });

      return tx.employee.findUnique({
        where: { id: employee.id },
        include: {
          department: true,
          manager: true,
        },
      });
    });
  }

  async findAll(filters: {
    departmentId?: string;
    status?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
    };

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        include: {
          department: true,
          manager: true,
        },
        orderBy: {
          employeeCode: 'asc',
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return this.prisma.employee.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        department: true,
        manager: true,
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const updateData: Prisma.EmployeeUpdateInput = {
      employeeCode: dto.employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
      designation: dto.designation,
      manager: dto.managerId !== undefined 
        ? (dto.managerId ? { connect: { id: dto.managerId } } : { disconnect: true }) 
        : undefined,
      dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
      dateOfExit: dto.dateOfExit ? new Date(dto.dateOfExit) : undefined,
      status: dto.status,
    };

    return this.prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          manager: true,
        },
      });

      // Update User email and status if modified in employee profile
      if (dto.email || dto.status) {
        const user = await tx.user.findUnique({ where: { employeeId: id } });
        if (user) {
          await tx.user.update({
            where: { employeeId: id },
            data: {
              email: dto.email || undefined,
              isActive: dto.status ? (dto.status === 'ACTIVE') : undefined,
            },
          });
        }
      }

      return updatedEmployee;
    });
  }

  async softDelete(id: string) {
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

      return { success: true };
    });
  }
}
