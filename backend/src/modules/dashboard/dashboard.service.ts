import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getAdminDashboard() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const [totalEmployees, headcountByDept, attendancePercent, pendingLeaves, payrollStatus] = await Promise.all([
      this.dashboardRepository.getActiveEmployeeCount(),
      this.dashboardRepository.getHeadcountByDepartment(),
      this.dashboardRepository.getTodayAttendancePercent(today),
      this.dashboardRepository.getPendingLeaveRequestsCount(),
      this.dashboardRepository.getPayrollStatus(month, year),
    ]);

    return {
      totalEmployees,
      headcountByDepartment: headcountByDept,
      todayAttendancePercent: attendancePercent,
      pendingLeaveRequestsCount: pendingLeaves,
      currentMonthPayrollStatus: payrollStatus,
    };
  }

  async getManagerDashboard(managerId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [teamSize, attendanceToday, pendingLeaves, leaveCalendar] = await Promise.all([
      this.dashboardRepository.getTeamSize(managerId),
      this.dashboardRepository.getTeamAttendanceToday(managerId, today),
      this.dashboardRepository.getTeamPendingLeaveCount(managerId),
      this.dashboardRepository.getTeamLeaveCalendar(managerId, startOfMonth, endOfMonth),
    ]);

    return {
      teamSize,
      teamAttendanceToday: attendanceToday.map((a) => ({
        employeeId: a.employeeId,
        name: `${a.employee.firstName} ${a.employee.lastName}`,
        designation: a.employee.designation,
        checkIn: a.checkIn,
        checkOut: a.checkOut,
        status: a.status,
      })),
      teamPendingLeavesCount: pendingLeaves,
      teamLeaveCalendar: leaveCalendar.map((l) => ({
        id: l.id,
        employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
        leaveType: l.leaveType.name,
        startDate: l.startDate,
        endDate: l.endDate,
        days: Number(l.days),
        reason: l.reason,
      })),
    };
  }

  async getEmployeeDashboard(employeeId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [leaveBalances, payslips, attendanceStats] = await Promise.all([
      this.dashboardRepository.getLeaveBalances(employeeId, year),
      this.dashboardRepository.getLastPayslips(employeeId, 3),
      this.dashboardRepository.getMonthlyAttendanceStats(employeeId, startOfMonth, endOfMonth),
    ]);

    return {
      leaveBalances: leaveBalances.map((b) => ({
        leaveType: b.leaveType.name,
        allocated: Number(b.allocated),
        used: Number(b.used),
        available: Number(b.allocated) - Number(b.used),
      })),
      lastPayslips: payslips.map((p) => ({
        id: p.id,
        month: p.payrollRun.month,
        year: p.payrollRun.year,
        netPay: Number(p.netPay),
        grossPay: Number(p.grossPay),
        generatedAt: p.generatedAt,
      })),
      attendanceStats: {
        presentDays: attendanceStats.present,
        lateDays: attendanceStats.late,
        halfDays: attendanceStats.halfDay,
        absentDays: attendanceStats.absent,
        streakDays: attendanceStats.streak,
      },
    };
  }
}
