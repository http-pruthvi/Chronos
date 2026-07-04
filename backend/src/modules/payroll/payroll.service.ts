import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PayrollRepository } from './payroll.repository';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { PayrollRunStatus, SalaryComponentType, LeaveRequestStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(
    private readonly payrollRepository: PayrollRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async createRun(dto: CreatePayrollRunDto, actorUserId: string) {
    const existing = await this.payrollRepository.findRunByMonthYear(dto.month, dto.year);
    if (existing) {
      throw new BadRequestException(`A payroll run already exists for ${dto.month}/${dto.year}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          month: dto.month,
          year: dto.year,
          status: PayrollRunStatus.DRAFT,
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'PAYROLL_RUN_CREATED',
        entityType: 'PayrollRun',
        entityId: run.id,
        afterState: run,
      }, tx);

      return run;
    });
  }

  async processRun(id: string, actorUserId: string) {
    const run = await this.payrollRepository.findRunById(id);
    if (!run) {
      throw new NotFoundException(`Payroll run with ID "${id}" not found`);
    }

    if (run.status === PayrollRunStatus.PAID) {
      throw new BadRequestException('Cannot reprocess a paid/locked payroll run');
    }

    const { month, year } = run;
    
    // Dates for the month boundary
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Fetch all active employees in this month
    const employees = await this.prisma.employee.findMany({
      where: {
        deletedAt: null,
        dateOfJoining: { lte: endDate },
        OR: [
          { dateOfExit: null },
          { dateOfExit: { gte: startDate } },
        ],
      },
      include: {
        salaryStructures: {
          include: {
            component: true,
          },
        },
      },
    });

    return this.prisma.$transaction(async (tx) => {
      // 1. Clear any existing payslips for this run
      await tx.payslip.deleteMany({
        where: { payrollRunId: id },
      });

      // 2. Loop and generate payslip for each employee
      for (const emp of employees) {
        // Calculate active days in month (handling mid-month joiner / exit)
        let activeDays = totalDaysInMonth;
        const joinDate = new Date(emp.dateOfJoining);
        
        if (joinDate.getTime() > startDate.getTime()) {
          // Joined mid-month
          activeDays = totalDaysInMonth - joinDate.getDate() + 1;
        }

        if (emp.dateOfExit) {
          const exitDate = new Date(emp.dateOfExit);
          if (exitDate.getTime() < endDate.getTime()) {
            // Exited mid-month
            const unworkedAfterExit = totalDaysInMonth - exitDate.getDate();
            activeDays = activeDays - unworkedAfterExit;
          }
        }
        
        activeDays = Math.max(0, activeDays);

        // Fetch unpaid leave days (Approved requests of "Unpaid Leave" type in this month)
        const unpaidLeaves = await tx.leaveRequest.findMany({
          where: {
            employeeId: emp.id,
            status: LeaveRequestStatus.APPROVED,
            leaveType: { name: 'Unpaid Leave' },
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        });

        let unpaidLeaveDays = 0;
        for (const leave of unpaidLeaves) {
          // Calculate overlap days in this month
          const leaveStart = new Date(Math.max(leave.startDate.getTime(), startDate.getTime()));
          const leaveEnd = new Date(Math.min(leave.endDate.getTime(), endDate.getTime()));
          const diff = Math.abs(leaveEnd.getTime() - leaveStart.getTime());
          const overlapDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
          unpaidLeaveDays += overlapDays;
        }

        // Fetch absences from Attendance records
        const attendances = await tx.attendance.findMany({
          where: {
            employeeId: emp.id,
            date: { gte: startDate, lte: endDate },
            status: { in: ['ABSENT', 'HALF_DAY'] },
          },
        });

        let absentDays = 0;
        for (const att of attendances) {
          if (att.status === 'ABSENT') {
            absentDays += 1;
          } else if (att.status === 'HALF_DAY') {
            absentDays += 0.5;
          }
        }

        const totalUnpaidDays = Math.min(activeDays, unpaidLeaveDays + absentDays);
        
        // Calculate proration factor
        const prorationFactor = activeDays > 0 ? (activeDays - totalUnpaidDays) / totalDaysInMonth : 0;

        let grossPay = 0;
        let totalDeductions = 0;
        const lineItems = [];

        // Calculate components
        for (const struct of emp.salaryStructures) {
          const originalValue = Number(struct.value);
          const proratedValue = Math.round(originalValue * prorationFactor * 100) / 100;

          if (struct.component.type === SalaryComponentType.EARNING) {
            grossPay += proratedValue;
          } else {
            totalDeductions += proratedValue;
          }

          lineItems.push({
            componentId: struct.componentId,
            name: struct.component.name,
            type: struct.component.type,
            originalValue,
            proratedValue,
          });
        }

        const netPay = Math.max(0, grossPay - totalDeductions);

        // Save payslip
        await tx.payslip.create({
          data: {
            payrollRunId: id,
            employeeId: emp.id,
            grossPay: new Prisma.Decimal(grossPay),
            totalDeductions: new Prisma.Decimal(totalDeductions),
            netPay: new Prisma.Decimal(netPay),
            lineItems: lineItems as any,
          },
        });
      }

      // 3. Mark run as processed
      const updatedRun = await tx.payrollRun.update({
        where: { id },
        data: {
          status: PayrollRunStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'PAYROLL_RUN_PROCESSED',
        entityType: 'PayrollRun',
        entityId: id,
        beforeState: run,
        afterState: updatedRun,
      }, tx);

      return updatedRun;
    });
  }

  async payRun(id: string, actorUserId: string) {
    const run = await this.payrollRepository.findRunById(id);
    if (!run) {
      throw new NotFoundException(`Payroll run with ID "${id}" not found`);
    }

    if (run.status !== PayrollRunStatus.PROCESSED) {
      throw new BadRequestException('Payroll run must be processed before it can be marked as paid');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRun = await tx.payrollRun.update({
        where: { id },
        data: {
          status: PayrollRunStatus.PAID,
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'PAYROLL_RUN_PAID',
        entityType: 'PayrollRun',
        entityId: id,
        beforeState: run,
        afterState: updatedRun,
      }, tx);

      return updatedRun;
    });
  }

  async getRun(id: string) {
    const run = await this.payrollRepository.findRunById(id);
    if (!run) {
      throw new NotFoundException(`Payroll run with ID "${id}" not found`);
    }
    return run;
  }

  async getMyPayslips(employeeId: string) {
    return this.payrollRepository.findOwnPayslips(employeeId);
  }

  async getPayslip(id: string, requesterEmployeeId: string | null, roleName: string) {
    const payslip = await this.payrollRepository.findPayslipById(id);
    if (!payslip) {
      throw new NotFoundException(`Payslip with ID "${id}" not found`);
    }

    // RBAC access check
    const isHR = roleName === 'HR';
    const isAdmin = roleName === 'ADMIN';
    const isOwner = payslip.employeeId === requesterEmployeeId;

    if (!isAdmin && !isHR && !isOwner) {
      throw new ForbiddenException('Access Denied: You cannot view this payslip');
    }

    return payslip;
  }
}
