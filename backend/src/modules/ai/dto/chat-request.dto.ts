import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ example: 'Can I combine casual leave with sick leave?', description: 'The question for the HR Policy Assistant' })
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  message: string;
}
