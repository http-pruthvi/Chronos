import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaveRequestStatus, Prisma } from '@prisma/client';

@Injectable()
export class LeavesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLeaveTypes() {
    return this.prisma.leaveType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findBalancesByEmployeeId(employeeId: string, year: number) {
    return this.prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year,
      },
      include: {
        leaveType: true,
      },
    });
  }

  async findBalance(employeeId: string, leaveTypeId: string, year: number) {
    return this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year,
        },
      },
      include: {
        leaveType: true,
      },
    });
  }

  async findRequestById(id: string) {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        leaveType: true,
        approver: true,
      },
    });
  }

  async findConflictingRequests(employeeId: string, start: Date, end: Date) {
    return this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: {
          in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
        },
        OR: [
          // Overlap check
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });
  }

  async findOwnRequests(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      include: {
        leaveType: true,
        approver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingRequestsForReports(managerId: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        status: LeaveRequestStatus.PENDING,
        employee: {
          managerId,
          deletedAt: null,
        },
      },
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingRequestsAll() {
    return this.prisma.leaveRequest.findMany({
      where: {
        status: LeaveRequestStatus.PENDING,
      },
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequest(
    data: {
      employeeId: string;
      leaveTypeId: string;
      startDate: Date;
      endDate: Date;
      days: number;
      reason?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        days: new Prisma.Decimal(data.days),
        reason: data.reason || null,
        status: LeaveRequestStatus.PENDING,
      },
      include: {
        leaveType: true,
      },
    });
  }

  async updateRequestStatus(
    id: string,
    status: LeaveRequestStatus,
    approverId: string | null,
    decidedAt: Date | null,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.leaveRequest.update({
      where: { id },
      data: {
        status,
        approverId,
        decidedAt,
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });
  }

  async incrementUsedBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    days: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.leaveBalance.update({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year,
        },
      },
      data: {
        used: {
          increment: new Prisma.Decimal(days),
        },
      },
    });
  }
}
