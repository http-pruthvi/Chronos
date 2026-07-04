import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { AttendanceStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  async checkIn(employeeId: string, actorUserId: string) {
    const now = new Date();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 1. Check if employee is active
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
    });
    if (!employee || employee.status === 'TERMINATED') {
      throw new BadRequestException('Employee is inactive or not found');
    }

    // 2. Check if already checked in today
    const existingRecord = await this.attendanceRepository.findCurrentDayRecord(employeeId, today);
    if (existingRecord && existingRecord.checkIn) {
      throw new BadRequestException('You have already checked in today');
    }

    // 3. Determine status based on shift arrival time (threshold: 09:15 AM)
    // We check local hours and minutes of the check-in event
    const checkInHour = now.getHours();
    const checkInMinute = now.getMinutes();
    
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
      status = AttendanceStatus.LATE;
    }

    // If employee status is ON_LEAVE, override or block
    if (employee.status === 'ON_LEAVE') {
      status = AttendanceStatus.ON_LEAVE;
    }

    return this.prisma.$transaction(async (tx) => {
      let record;
      if (existingRecord) {
        // Update record if created as absent or placeholder
        record = await tx.attendance.update({
          where: { id: existingRecord.id },
          data: {
            checkIn: now,
            status,
          },
        });
      } else {
        // Create new record
        record = await tx.attendance.create({
          data: {
            employeeId,
            date: today,
            checkIn: now,
            status,
          },
        });
      }

      await this.auditLogsService.log({
        actorUserId,
        action: 'ATTENDANCE_CHECKIN',
        entityType: 'Attendance',
        entityId: record.id,
        afterState: record,
      }, tx);

      return record;
    });
  }

  async checkOut(employeeId: string, actorUserId: string) {
    const now = new Date();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const record = await this.attendanceRepository.findCurrentDayRecord(employeeId, today);
    if (!record || !record.checkIn) {
      throw new BadRequestException('Cannot check out without checking in first');
    }

    if (record.checkOut) {
      throw new BadRequestException('You have already checked out today');
    }

    // Calculate worked minutes
    const checkInTime = new Date(record.checkIn).getTime();
    const checkOutTime = now.getTime();
    const workedMinutes = Math.floor((checkOutTime - checkInTime) / 60000); // ms to minutes

    // Determine status:
    // If worked minutes < 240 (4 hours) -> HALF_DAY
    // Else, keep LATE if they checked in late, otherwise PRESENT
    let status: AttendanceStatus = record.status;
    if (workedMinutes < 240) {
      status = AttendanceStatus.HALF_DAY;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.attendance.update({
        where: { id: record.id },
        data: {
          checkOut: now,
          workedMinutes,
          status,
        },
      });

      await this.auditLogsService.log({
        actorUserId,
        action: 'ATTENDANCE_CHECKOUT',
        entityType: 'Attendance',
        entityId: record.id,
        beforeState: record,
        afterState: updatedRecord,
      }, tx);

      return updatedRecord;
    });
  }

  async getMyAttendance(employeeId: string, month?: number, year?: number) {
    const now = new Date();
    const queryMonth = month || (now.getMonth() + 1);
    const queryYear = year || now.getFullYear();

    return this.attendanceRepository.findByEmployeeId(employeeId, queryMonth, queryYear);
  }

  async getTeamAttendance(managerId: string, month?: number, year?: number) {
    const now = new Date();
    const queryMonth = month || (now.getMonth() + 1);
    const queryYear = year || now.getFullYear();

    // Verify manager exists
    const manager = await this.prisma.employee.findFirst({
      where: { id: managerId, deletedAt: null },
    });
    if (!manager) {
      throw new NotFoundException(`Manager with ID "${managerId}" not found`);
    }

    return this.attendanceRepository.findByManagerId(managerId, queryMonth, queryYear);
  }

  async getEmployeeAttendance(employeeId: string, month?: number, year?: number) {
    const now = new Date();
    const queryMonth = month || (now.getMonth() + 1);
    const queryYear = year || now.getFullYear();

    // Verify employee exists
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${employeeId}" not found`);
    }

    return this.attendanceRepository.findByEmployeeId(employeeId, queryMonth, queryYear);
  }
}
