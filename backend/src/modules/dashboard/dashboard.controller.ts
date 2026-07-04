import {
  Controller,
  Get,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Permissions('payroll:run') // Only HR/ADMIN can view admin metrics
  @ApiOperation({ summary: 'Get Admin dashboard metrics (HR, ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Admin metrics retrieved successfully',
  })
  async getAdminDashboard() {
    const data = await this.dashboardService.getAdminDashboard();
    return { data };
  }

  @Get('manager')
  @Permissions('attendance:read_team') // Only MANAGER/HR/ADMIN can view team metrics
  @ApiOperation({ summary: 'Get Manager dashboard metrics (MANAGER)' })
  @ApiResponse({
    status: 200,
    description: 'Manager metrics retrieved successfully',
  })
  async getManagerDashboard(
    @CurrentUser('employeeId') employeeId: string | null,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'No employee profile associated with this user.',
      );
    }
    const data = await this.dashboardService.getManagerDashboard(employeeId);
    return { data };
  }

  @Get('employee')
  @Permissions('attendance:read') // Everyone can view own employee metrics
  @ApiOperation({ summary: 'Get Employee dashboard metrics (self)' })
  @ApiResponse({
    status: 200,
    description: 'Employee metrics retrieved successfully',
  })
  async getEmployeeDashboard(
    @CurrentUser('employeeId') employeeId: string | null,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'No employee profile associated with this user.',
      );
    }
    const data = await this.dashboardService.getEmployeeDashboard(employeeId);
    return { data };
  }
}
