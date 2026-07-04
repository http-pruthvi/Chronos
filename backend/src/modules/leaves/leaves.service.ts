import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LeavesRepository } from './leaves.repository';
import { ApplyLeaveDto } from './dto/apply-leave.dto';
import { LeaveRequestStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeavesService {
  constructor(
    private readonly leavesRepository: LeavesRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async getLeaveTypes() {
    return this.leavesRepository.findLeaveTypes();
  }

  async getLeaveBalances(employeeId: string, year?: number) {
    const queryYear = year || new Date().getFullYear();
    return this.leavesRepository.findBalancesByEmployeeId(employeeId, queryYear);
  }

  async applyLeave(dto: ApplyLeaveDto, employeeId: string, actorUserId: string) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    
    // Set times to midnight to avoid time discrepancies
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // Calculate days: difference in ms / ms in day + 1 day
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const year = start.getFullYear();

    // 1. Check if balance quota exists
    const balance = await this.leavesRepository.findBalance(employeeId, dto.leaveTypeId, year);
    if (!balance) {
      throw new BadRequestException('No leave quota allocated for this type in the requested year');
    }

    const allocated = Number(balance.allocated);
    const used = Number(balance.used);
    const available = allocated - used;

    if (days > available) {
      throw new BadRequestException({
        code: 'LEAVE_INSUFFICIENT_BALANCE',
        message: `Requested ${days} days but only ${available} remain.`,
        details: { available, requested: days },
      });
    }

    // 2. Check for overlapping requests (Pending or Approved)
    const conflicts = await this.leavesRepository.findConflictingRequests(employeeId, start, end);
    if (conflicts.length > 0) {
      throw new BadRequestException('You already have a pending or approved leave request during this period');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: dto.leaveTypeId,
          startDate: start,
          endDate: end,
          days: new Prisma.Decimal(days),
          reason: dto.reason || null,
          status: LeaveRequestStatus.PENDING,
        },
        include: {
          leaveType: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'LEAVE_REQUESTED',
        entityType: 'LeaveRequest',
        entityId: request.id,
        afterState: request,
      }, tx);

      return request;
    });
  }

  async getOwnRequests(employeeId: string) {
    return this.leavesRepository.findOwnRequests(employeeId);
  }

  async getPendingRequests(approverEmployeeId: string, roleName: string) {
    const isHR = roleName === 'HR';
    const isAdmin = roleName === 'ADMIN';

    if (isAdmin || isHR) {
      return this.leavesRepository.findPendingRequestsAll();
    } else if (roleName === 'MANAGER') {
      return this.leavesRepository.findPendingRequestsForReports(approverEmployeeId);
    }

    return [];
  }

  async approve(id: string, approverEmployeeId: string, roleName: string, actorUserId: string) {
    const request = await this.leavesRepository.findRequestById(id);
    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be approved');
    }

    // Validate approval authority (Approver must be direct manager or HR/Admin)
    const isHR = roleName === 'HR';
    const isAdmin = roleName === 'ADMIN';
    const isDirectManager = request.employee.managerId === approverEmployeeId;

    if (!isAdmin && !isHR && !isDirectManager) {
      throw new ForbiddenException('You do not have permission to decide on this leave request');
    }

    const year = new Date(request.startDate).getFullYear();
    const days = Number(request.days);

    // Recheck balance availability
    const balance = await this.leavesRepository.findBalance(request.employeeId, request.leaveTypeId, year);
    if (!balance) {
      throw new BadRequestException('No leave balance allocated for this year');
    }

    const allocated = Number(balance.allocated);
    const used = Number(balance.used);
    const available = allocated - used;

    if (days > available) {
      throw new BadRequestException(`Insufficient leave balance remaining to approve. Available: ${available}, Requested: ${days}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Request Status
      const approvedRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.APPROVED,
          approverId: approverEmployeeId,
          decidedAt: new Date(),
        },
        include: {
          leaveType: true,
          employee: true,
        },
      });

      // 2. Increment Used Quota
      await tx.leaveBalance.update({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
        data: {
          used: {
            increment: new Prisma.Decimal(days),
          },
        },
      });

      // 3. Write Audit Log
      await this.auditLogsService.log({
        actorUserId,
        action: 'LEAVE_APPROVED',
        entityType: 'LeaveRequest',
        entityId: id,
        beforeState: request,
        afterState: approvedRequest,
      }, tx);

      return approvedRequest;
    });
  }

  async reject(id: string, approverEmployeeId: string, roleName: string, actorUserId: string) {
    const request = await this.leavesRepository.findRequestById(id);
    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be rejected');
    }

    const isHR = roleName === 'HR';
    const isAdmin = roleName === 'ADMIN';
    const isDirectManager = request.employee.managerId === approverEmployeeId;

    if (!isAdmin && !isHR && !isDirectManager) {
      throw new ForbiddenException('You do not have permission to decide on this leave request');
    }

    return this.prisma.$transaction(async (tx) => {
      const rejectedRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.REJECTED,
          approverId: approverEmployeeId,
          decidedAt: new Date(),
        },
        include: {
          leaveType: true,
          employee: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'LEAVE_REJECTED',
        entityType: 'LeaveRequest',
        entityId: id,
        beforeState: request,
        afterState: rejectedRequest,
      }, tx);

      return rejectedRequest;
    });
  }

  async cancel(id: string, employeeId: string, actorUserId: string) {
    const request = await this.leavesRepository.findRequestById(id);
    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }

    if (request.employeeId !== employeeId) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const cancelledRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.CANCELLED,
        },
        include: {
          leaveType: true,
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'LEAVE_CANCELLED',
        entityType: 'LeaveRequest',
        entityId: id,
        beforeState: request,
        afterState: cancelledRequest,
      }, tx);

      return cancelledRequest;
    });
  }
}
