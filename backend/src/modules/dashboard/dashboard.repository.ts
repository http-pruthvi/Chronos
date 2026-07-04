import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EmployeeStatus,
  AttendanceStatus,
  LeaveRequestStatus,
} from '@prisma/client';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- ADMIN METRICS ---
  async getActiveEmployeeCount() {
    return this.prisma.employee.count({
      where: {
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }

  async getHeadcountByDepartment() {
    const counts = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      _count: {
        id: true,
      },
      where: {
        deletedAt: null,
      },
    });

    const departments = await this.prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });

    return counts.map((c) => {
      const dept = departments.find((d) => d.id === c.departmentId);
      return {
        departmentId: c.departmentId,
        departmentName: dept ? dept.name : 'Unknown',
        count: c._count.id,
      };
    });
  }

  async getTodayAttendancePercent(today: Date) {
    const totalActive = await this.prisma.employee.count({
      where: {
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (totalActive === 0) return 0;

    const checkedInCount = await this.prisma.attendance.count({
      where: {
        date: today,
        checkIn: { not: null },
        status: {
          in: [
            AttendanceStatus.PRESENT,
            AttendanceStatus.LATE,
            AttendanceStatus.HALF_DAY,
          ],
        },
      },
    });

    return Math.round((checkedInCount / totalActive) * 100);
  }

  async getPendingLeaveRequestsCount() {
    return this.prisma.leaveRequest.count({
      where: {
        status: LeaveRequestStatus.PENDING,
      },
    });
  }

  async getPayrollStatus(month: number, year: number) {
    const run = await this.prisma.payrollRun.findUnique({
      where: {
        month_year: { month, year },
      },
    });
    return run ? run.status : 'NO_RUN';
  }

  // --- MANAGER METRICS ---
  async getTeamSize(managerId: string) {
    return this.prisma.employee.count({
      where: {
        managerId,
        deletedAt: null,
      },
    });
  }

  async getTeamAttendanceToday(managerId: string, today: Date) {
    return this.prisma.attendance.findMany({
      where: {
        date: today,
        employee: {
          managerId,
          deletedAt: null,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
    });
  }

  async getTeamPendingLeaveCount(managerId: string) {
    return this.prisma.leaveRequest.count({
      where: {
        status: LeaveRequestStatus.PENDING,
        employee: {
          managerId,
          deletedAt: null,
        },
      },
    });
  }

  async getTeamLeaveCalendar(managerId: string, start: Date, end: Date) {
    return this.prisma.leaveRequest.findMany({
      where: {
        status: LeaveRequestStatus.APPROVED,
        employee: {
          managerId,
          deletedAt: null,
        },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        leaveType: true,
      },
    });
  }

  // --- EMPLOYEE METRICS ---
  async getLeaveBalances(employeeId: string, year: number) {
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

  async getLastPayslips(employeeId: string, count: number) {
    return this.prisma.payslip.findMany({
      where: { employeeId },
      include: {
        payrollRun: true,
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: count,
    });
  }

  async getMonthlyAttendanceStats(employeeId: string, start: Date, end: Date) {
    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: start, lte: end },
      },
    });

    const stats = {
      present: 0,
      late: 0,
      halfDay: 0,
      absent: 0,
      streak: 0,
    };

    // Count states
    attendances.forEach((a) => {
      if (a.status === AttendanceStatus.PRESENT) stats.present++;
      else if (a.status === AttendanceStatus.LATE) stats.late++;
      else if (a.status === AttendanceStatus.HALF_DAY) stats.halfDay++;
      else if (a.status === AttendanceStatus.ABSENT) stats.absent++;
    });

    // Simple Streak calculation: consecutive days checking in sorted by date
    const sortedDates = attendances
      .filter((a) => a.checkIn !== null && a.status !== AttendanceStatus.ABSENT)
      .map((a) => new Date(a.date).getTime())
      .sort((a, b) => b - a); // descending order (latest first)

    let currentStreak = 0;
    let expectedTime = new Date().setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const dateVal = sortedDates[i];
      // Skip today if they haven't checked in yet, but check if yesterday is present
      if (i === 0 && dateVal < expectedTime) {
        expectedTime = dateVal;
      }

      const diffDays = (expectedTime - dateVal) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) {
        currentStreak++;
        expectedTime = dateVal;
      } else {
        break;
      }
    }
    stats.streak = currentStreak;

    return stats;
  }
}
