import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyLeaveDto {
  @ApiProperty({
    example: 'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
    description: 'UUID of the leave type',
  })
  @IsUUID('4', { message: 'Leave type ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Leave type ID is required' })
  leaveTypeId: string;

  @ApiProperty({
    example: '2026-07-10',
    description: 'Start date of the leave (ISO string)',
  })
  @IsDateString({}, { message: 'Start date must be a valid date' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @ApiProperty({
    example: '2026-07-14',
    description: 'End date of the leave (ISO string)',
  })
  @IsDateString({}, { message: 'End date must be a valid date' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;

  @ApiProperty({
    example: 'Family vacation',
    description: 'Reason for leave request',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
