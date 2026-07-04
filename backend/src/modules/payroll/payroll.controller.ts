import { Controller, Post, Get, Param, Body, UseGuards, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { PayrollRunResponseDto, PayslipResponseDto } from './dto/payroll-run-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('payroll/runs')
  @Permissions('payroll:run')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new DRAFT payroll run for month/year (HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: PayrollRunResponseDto })
  async createRun(
    @Body() dto: CreatePayrollRunDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.payrollService.createRun(dto, actorUserId);
    return { data };
  }

  @Post('payroll/runs/:id/process')
  @Permissions('payroll:process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a payroll run and generate employee payslips (HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: PayrollRunResponseDto })
  async processRun(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.payrollService.processRun(id, actorUserId);
    return { data };
  }

  @Post('payroll/runs/:id/pay')
  @Permissions('payroll:process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a processed payroll run as PAID/LOCKED (HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: PayrollRunResponseDto })
  async payRun(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.payrollService.payRun(id, actorUserId);
    return { data };
  }

  @Get('payroll/runs/:id')
  @Permissions('payroll:run')
  @ApiOperation({ summary: 'Get details of a payroll run including generated payslips (HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: PayrollRunResponseDto })
  async getRun(@Param('id') id: string) {
    const data = await this.payrollService.getRun(id);
    return { data };
  }

  @Get('payslips/me')
  @Permissions('payroll:read')
  @ApiOperation({ summary: 'Get own payslip history (self)' })
  @ApiResponse({ status: HttpStatus.OK, type: [PayslipResponseDto] })
  async getMyPayslips(@CurrentUser('employeeId') employeeId: string | null) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile associated with this user.');
    }
    const data = await this.payrollService.getMyPayslips(employeeId);
    return { data };
  }

  @Get('payslips/:id')
  @Permissions('payroll:read')
  @ApiOperation({ summary: 'Get details of a specific payslip (self-owner, HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: PayslipResponseDto })
  async getPayslip(
    @Param('id') id: string,
    @CurrentUser('employeeId') employeeId: string | null,
    @CurrentUser('role') roleName: string,
  ) {
    const data = await this.payrollService.getPayslip(id, employeeId, roleName);
    return { data };
  }

  @Get('payroll/runs/:id/anomalies')
  @Permissions('payroll:process') // Only HR/ADMIN who process payroll can view anomalies
  @ApiOperation({ summary: 'Get list of payroll anomalies for a run (HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Anomalies list retrieved successfully' })
  async getAnomalies(@Param('id') id: string) {
    const data = await this.payrollService.detectAnomalies(id);
    return { data };
  }
}
