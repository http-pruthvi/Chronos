import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: {
        name: dto.name,
        headEmployeeId: dto.headEmployeeId || null,
      },
      include: {
        headEmployee: true,
      },
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        headEmployee: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.department.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        headEmployee: true,
      },
    });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    return this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        headEmployeeId: dto.headEmployeeId === undefined ? undefined : dto.headEmployeeId,
      },
      include: {
        headEmployee: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.department.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
