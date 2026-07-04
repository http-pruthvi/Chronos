import { ApiProperty } from '@nestjs/swagger';

export class DepartmentHeadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

export class DepartmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  headEmployeeId: string | null;

  @ApiProperty({ type: DepartmentHeadResponseDto, nullable: true })
  headEmployee?: DepartmentHeadResponseDto | null;

  @ApiProperty()
  createdAt: Date;
}
