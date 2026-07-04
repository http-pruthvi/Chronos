import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Permissions('department:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department (ADMIN)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: DepartmentResponseDto })
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.departmentsService.create(
      createDepartmentDto,
      actorUserId,
    );
    return { data };
  }

  @Get()
  @Permissions('department:read')
  @ApiOperation({ summary: 'Get all active departments' })
  @ApiResponse({ status: HttpStatus.OK, type: [DepartmentResponseDto] })
  async findAll() {
    const data = await this.departmentsService.findAll();
    return { data };
  }

  @Get(':id')
  @Permissions('department:read')
  @ApiOperation({ summary: 'Get a department by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: DepartmentResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department not found',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.departmentsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @Permissions('department:update')
  @ApiOperation({ summary: 'Update a department (ADMIN)' })
  @ApiResponse({ status: HttpStatus.OK, type: DepartmentResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    const data = await this.departmentsService.update(
      id,
      updateDepartmentDto,
      actorUserId,
    );
    return { data };
  }

  @Delete(':id')
  @Permissions('department:delete')
  @ApiOperation({ summary: 'Soft delete a department (ADMIN)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Department not found',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.departmentsService.remove(id, actorUserId);
  }
}
