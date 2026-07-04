import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrentDayRecord(employeeId: string, date: Date) {
    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    return this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: searchDate,
        },
      },
    });
  }

  async create(employeeId: string, date: Date, checkIn: Date, status: AttendanceStatus) {
    const todayDate = new Date(date);
    todayDate.setUTCHours(0, 0, 0, 0);

    return this.prisma.attendance.create({
      data: {
        employeeId,
        date: todayDate,
        checkIn,
        status,
      },
    });
  }

  async update(id: string, checkOut: Date, workedMinutes: number, status: AttendanceStatus) {
    return this.prisma.attendance.update({
      where: { id },
      data: {
        checkOut,
        workedMinutes,
        status,
      },
    });
  }

  async findByEmployeeId(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findByManagerId(managerId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.attendance.findMany({
      where: {
        employee: {
          managerId,
          deletedAt: null,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findAll(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
}
