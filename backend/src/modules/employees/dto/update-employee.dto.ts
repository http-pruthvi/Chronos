import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiProperty({ example: '2026-06-30', description: 'Date of exit (ISO string)', required: false })
  @IsDateString({}, { message: 'Date of exit must be a valid date' })
  @IsOptional()
  dateOfExit?: string;
}
