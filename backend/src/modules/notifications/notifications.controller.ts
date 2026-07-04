import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own in-app notifications (self)' })
  @ApiResponse({ status: HttpStatus.OK, type: [NotificationResponseDto] })
  async getMyNotifications(@CurrentUser('id') userId: string) {
    const data = await this.notificationsService.getMyNotifications(userId);
    return { data };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark an in-app notification as read (self)' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const data = await this.notificationsService.markAsRead(id, userId);
    return { data };
  }
}
