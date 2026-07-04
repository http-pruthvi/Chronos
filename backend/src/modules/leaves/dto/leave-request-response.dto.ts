import { ApiProperty } from '@nestjs/swagger';
import { LeaveRequestStatus } from '@prisma/client';

export class LeaveTypeMinimalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class EmployeeMinimalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

export class LeaveRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty({ type: EmployeeMinimalDto })
  employee?: EmployeeMinimalDto;

  @ApiProperty()
  leaveTypeId: string;

  @ApiProperty({ type: LeaveTypeMinimalDto })
  leaveType?: LeaveTypeMinimalDto;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  days: number;

  @ApiProperty({ nullable: true })
  reason: string | null;

  @ApiProperty({ enum: LeaveRequestStatus })
  status: LeaveRequestStatus;

  @ApiProperty({ nullable: true })
  approverId: string | null;

  @ApiProperty({ type: EmployeeMinimalDto, nullable: true })
  approver?: EmployeeMinimalDto | null;

  @ApiProperty({ nullable: true })
  decidedAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
