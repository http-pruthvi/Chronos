import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Permissions('employee:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new employee profile (HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: EmployeeResponseDto })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.employeesService.create(createEmployeeDto, actorUserId);
    return { data };
  }

  @Get()
  @Permissions('employee:read')
  @ApiOperation({ summary: 'Get list of employees with filters and pagination' })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.employeesService.findAll({
      departmentId,
      status,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  @Permissions('employee:read')
  @ApiOperation({ summary: 'Get an employee profile by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: EmployeeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.employeesService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @Permissions('employee:update')
  @ApiOperation({ summary: 'Update employee profile details (HR, ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: EmployeeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.employeesService.update(id, updateEmployeeDto, actorUserId);
    return { data };
  }

  @Delete(':id')
  @Permissions('employee:delete')
  @ApiOperation({ summary: 'Soft delete/offboard employee profile (ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Employee not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.employeesService.remove(id, actorUserId);
  }
}
