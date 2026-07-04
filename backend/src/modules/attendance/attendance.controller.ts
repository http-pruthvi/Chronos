import { Controller, Post, Get, Param, Query, UseGuards, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Permissions('attendance:checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employee check-in' })
  @ApiResponse({ status: HttpStatus.OK, type: AttendanceResponseDto })
  async checkIn(
    @CurrentUser('employeeId') employeeId: string | null,
    @CurrentUser('id') actorUserId: string,
  ) {
    if (!employeeId) {
      throw new BadRequestException('This system administrator account is not linked to an employee profile.');
    }
    const data = await this.attendanceService.checkIn(employeeId, actorUserId);
    return { data };
  }

  @Post('check-out')
  @Permissions('attendance:checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employee check-out' })
  @ApiResponse({ status: HttpStatus.OK, type: AttendanceResponseDto })
  async checkOut(
    @CurrentUser('employeeId') employeeId: string | null,
    @CurrentUser('id') actorUserId: string,
  ) {
    if (!employeeId) {
      throw new BadRequestException('This system administrator account is not linked to an employee profile.');
    }
    const data = await this.attendanceService.checkOut(employeeId, actorUserId);
    return { data };
  }

  @Get('me')
  @Permissions('attendance:read')
  @ApiOperation({ summary: 'Get own attendance log for a specific month/year' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK })
  async getMyAttendance(
    @CurrentUser('employeeId') employeeId: string | null,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile associated with this user.');
    }
    const data = await this.attendanceService.getMyAttendance(employeeId, month, year);
    return { data };
  }

  @Get('team')
  @Permissions('attendance:read_team')
  @ApiOperation({ summary: 'Get team reports attendance log (MANAGER)' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK })
  async getTeamAttendance(
    @CurrentUser('employeeId') employeeId: string | null,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile associated with this manager user.');
    }
    const data = await this.attendanceService.getTeamAttendance(employeeId, month, year);
    return { data };
  }

  @Get(':employeeId')
  @Permissions('attendance:read_all')
  @ApiOperation({ summary: 'Get specific employee attendance logs (HR, ADMIN)' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK })
  async getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const data = await this.attendanceService.getEmployeeAttendance(employeeId, month, year);
    return { data };
  }
}
