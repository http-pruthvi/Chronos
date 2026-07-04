import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateDepartmentDto, actorUserId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const department = await tx.department.create({
        data: {
          name: dto.name,
          headEmployeeId: dto.headEmployeeId || null,
        },
        include: {
          headEmployee: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'DEPARTMENT_CREATED',
        entityType: 'Department',
        entityId: department.id,
        afterState: department,
      }, tx);

      return department;
    });
  }

  async findAll() {
    return this.departmentsRepository.findAll();
  }

  async findOne(id: string) {
    const department = await this.departmentsRepository.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto, actorUserId?: string) {
    const beforeState = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updatedDepartment = await tx.department.update({
        where: { id },
        data: {
          name: dto.name,
          headEmployeeId: dto.headEmployeeId === undefined ? undefined : dto.headEmployeeId,
        },
        include: {
          headEmployee: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'DEPARTMENT_UPDATED',
        entityType: 'Department',
        entityId: id,
        beforeState,
        afterState: updatedDepartment,
      }, tx);

      return updatedDepartment;
    });
  }

  async remove(id: string, actorUserId?: string) {
    const beforeState = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.department.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'DEPARTMENT_DELETED',
        entityType: 'Department',
        entityId: id,
        beforeState,
        afterState: { deleted: true },
      }, tx);

      return { success: true, message: 'Department successfully deleted' };
    });
  }
}
