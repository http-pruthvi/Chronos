import { ApiProperty } from '@nestjs/swagger';
import { PayrollRunStatus } from '@prisma/client';

export class PayslipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  payrollRunId: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  grossPay: number;

  @ApiProperty()
  totalDeductions: number;

  @ApiProperty()
  netPay: number;

  @ApiProperty()
  lineItems: any;

  @ApiProperty()
  generatedAt: Date;
}

export class PayrollRunResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  month: number;

  @ApiProperty()
  year: number;

  @ApiProperty({ enum: PayrollRunStatus })
  status: PayrollRunStatus;

  @ApiProperty({ nullable: true })
  processedAt: Date | null;

  @ApiProperty({ type: [PayslipResponseDto], required: false })
  payslips?: PayslipResponseDto[];
}
