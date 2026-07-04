import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, title: string, body?: string) {
    const notification = await this.notificationsRepository.create(
      userId,
      title,
      body,
    );

    // Fetch user details for the email stub
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.sendEmailStub(user.email, title, body || '');
    }

    return notification;
  }

  async getMyNotifications(userId: string) {
    return this.notificationsRepository.findByUserId(userId);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'Access Denied: You cannot edit this notification',
      );
    }

    return this.notificationsRepository.markAsRead(id);
  }

  /**
   * Stub Email Interface for future production scale-out
   */
  private async sendEmailStub(
    toEmail: string,
    subject: string,
    body: string,
  ): Promise<void> {
    // STUB: Integration point for SMTP/SendGrid/SES
    // In production, this would dispatch to a BullMQ job queue to process asynchronously.
    await Promise.resolve();
    console.log(`[EMAIL INTEGRATION STUB] Dispatched email:
      To: ${toEmail}
      Subject: ${subject}
      Body: ${body}
    `);
  }
}
