import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { ApplyLeaveDto } from './dto/apply-leave.dto';
import { LeaveRequestResponseDto } from './dto/leave-request-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Leaves')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get('leave-types')
  @Permissions('leave:apply') // Anyone who can apply can read leave types
  @ApiOperation({ summary: 'Get all available leave types' })
  @ApiResponse({ status: HttpStatus.OK })
  async getLeaveTypes() {
    const data = await this.leavesService.getLeaveTypes();
    return { data };
  }

  @Get('leave-balances/me')
  @Permissions('leave:read')
  @ApiOperation({ summary: 'Get current year leave balances for logged in employee' })
  @ApiResponse({ status: HttpStatus.OK })
  async getMyBalances(@CurrentUser('employeeId') employeeId: string | null) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile associated with this user.');
    }
    const data = await this.leavesService.getLeaveBalances(employeeId);
    return { data };
  }

  @Post('leave-requests')
  @Permissions('leave:apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new leave request (self)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LeaveRequestResponseDto })
  async applyLeave(
    @Body() applyLeaveDto: ApplyLeaveDto,
    @CurrentUser('employeeId') employeeId: string | null,
    @CurrentUser('id') actorUserId: string,
  ) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile associated with this user.');
    }
    const data = await this.leavesService.applyLeave(applyLeaveDto, employeeId, actorUserId);
    return { data };
  }

  @Get('leave-requests/me')
  @Permissions('leave:read')
  @ApiOperation({ summary: 'Get own leave requests history (self)' })
  @ApiResponse({ status: HttpStatus.OK, type: [LeaveRequestResponseDto] })
  async getMyRequests(@CurrentUser('employeeId') employeeId: string | null) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile associated with this user.');
    }
    const data = await this.leavesService.getOwnRequests(employeeId);
    return { data };
  }

  @Get('leave-requests/pending')
  @Permissions('leave:approve')
  @ApiOperation({ summary: 'Get pending leave requests (MANAGER, HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: [LeaveRequestResponseDto] })
  async getPendingRequests(
    @CurrentUser('employeeId') employeeId: string | null,
    @CurrentUser('role') roleName: string,
  ) {
    const data = await this.leavesService.getPendingRequests(employeeId || '', roleName);
    return { data };
  }

  @Patch('leave-requests/:id/approve')
  @Permissions('leave:approve')
  @ApiOperation({ summary: 'Approve a pending leave request (MANAGER, HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: LeaveRequestResponseDto })
  async approveLeave(
    @Param('id') id: string,
    @CurrentUser('employeeId') approverEmployeeId: string | null,
    @CurrentUser('role') roleName: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.leavesService.approve(id, approverEmployeeId || '', roleName, actorUserId);
    return { data };
  }

  @Patch('leave-requests/:id/reject')
  @Permissions('leave:approve')
  @ApiOperation({ summary: 'Reject a pending leave request (MANAGER, HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: LeaveRequestResponseDto })
  async rejectLeave(
    @Param('id') id: string,
    @CurrentUser('employeeId') approverEmployeeId: string | null,
    @CurrentUser('role') roleName: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.leavesService.reject(id, approverEmployeeId || '', roleName, actorUserId);
    return { data };
  }

  @Patch('leave-requests/:id/cancel')
  @Permissions('leave:apply')
  @ApiOperation({ summary: 'Cancel a pending leave request (self)' })
  @ApiResponse({ status: HttpStatus.OK, type: LeaveRequestResponseDto })
  async cancelLeave(
    @Param('id') id: string,
    @CurrentUser('employeeId') employeeId: string | null,
    @CurrentUser('id') actorUserId: string,
  ) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile associated with this user.');
    }
    const data = await this.leavesService.cancel(id, employeeId, actorUserId);
    return { data };
  }
}
