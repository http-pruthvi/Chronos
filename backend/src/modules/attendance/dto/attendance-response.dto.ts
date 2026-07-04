import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  date: Date;

  @ApiProperty({ nullable: true })
  checkIn: Date | null;

  @ApiProperty({ nullable: true })
  checkOut: Date | null;

  @ApiProperty({ enum: AttendanceStatus })
  status: AttendanceStatus;

  @ApiProperty({ nullable: true })
  workedMinutes: number | null;
}
