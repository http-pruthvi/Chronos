import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Engineering', description: 'Name of the department' })
  @IsString()
  @IsNotEmpty({ message: 'Department name is required' })
  name: string;

  @ApiProperty({ example: 'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', description: 'UUID of the department head employee', required: false })
  @IsUUID('4', { message: 'Head employee ID must be a valid UUID' })
  @IsOptional()
  headEmployeeId?: string;
}
