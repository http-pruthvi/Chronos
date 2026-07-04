import { IsNotEmpty, IsString, IsEmail, IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-0042', description: 'Unique employee code' })
  @IsString()
  @IsNotEmpty({ message: 'Employee code is required' })
  employeeCode: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({ example: 'john.smith@demo.com', description: 'Work email' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', description: 'UUID of department' })
  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Department ID is required' })
  departmentId: string;

  @ApiProperty({ example: 'Senior Engineer', description: 'Job designation' })
  @IsString()
  @IsNotEmpty({ message: 'Designation is required' })
  designation: string;

  @ApiProperty({ example: 'b3c4d5e6-f78a-9b0c-1d2e-3f4a5b6c7d8e', description: 'UUID of reporting manager', required: false })
  @IsUUID('4', { message: 'Manager ID must be a valid UUID' })
  @IsOptional()
  managerId?: string;

  @ApiProperty({ example: '2025-01-01', description: 'Date of joining (ISO string)' })
  @IsDateString({}, { message: 'Date of joining must be a valid date' })
  @IsNotEmpty({ message: 'Date of joining is required' })
  dateOfJoining: string;

  @ApiProperty({ example: 'ACTIVE', enum: EmployeeStatus, required: false })
  @IsEnum(EmployeeStatus, { message: 'Invalid status value' })
  @IsOptional()
  status?: EmployeeStatus;

  @ApiProperty({ example: 'EMPLOYEE', description: 'System access role (ADMIN, HR, MANAGER, EMPLOYEE)', required: false })
  @IsString()
  @IsOptional()
  role?: string;
}
