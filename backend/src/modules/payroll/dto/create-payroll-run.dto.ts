import { IsNotEmpty, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayrollRunDto {
  @ApiProperty({ example: 7, description: 'Month of the payroll run (1-12)' })
  @IsInt()
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  @IsNotEmpty({ message: 'Month is required' })
  month: number;

  @ApiProperty({ example: 2026, description: 'Year of the payroll run' })
  @IsInt()
  @Min(2000, { message: 'Year must be greater than 2000' })
  @IsNotEmpty({ message: 'Year is required' })
  year: number;
}
