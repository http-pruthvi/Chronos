import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';

export class DepartmentMinimalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ManagerMinimalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

export class EmployeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty()
  departmentId: string;

  @ApiProperty({ type: DepartmentMinimalResponseDto })
  department?: DepartmentMinimalResponseDto;

  @ApiProperty()
  designation: string;

  @ApiProperty({ nullable: true })
  managerId: string | null;

  @ApiProperty({ type: ManagerMinimalResponseDto, nullable: true })
  manager?: ManagerMinimalResponseDto | null;

  @ApiProperty()
  dateOfJoining: Date;

  @ApiProperty({ nullable: true })
  dateOfExit: Date | null;

  @ApiProperty({ enum: EmployeeStatus })
  status: EmployeeStatus;

  @ApiProperty()
  createdAt: Date;
}
