import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AIService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI Policy Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask the HR Policy Assistant a question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI response retrieved successfully',
  })
  async chat(
    @Body() dto: ChatRequestDto,
    @CurrentUser('employeeId') employeeId: string | null,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'No employee profile associated with this user.',
      );
    }
    return this.aiService.chat(dto.message, employeeId);
  }
}
