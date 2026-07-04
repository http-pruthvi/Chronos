import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: {
      actorUserId?: string | null;
      action: string;
      entityType: string;
      entityId: string;
      beforeState?: Prisma.InputJsonValue;
      afterState?: Prisma.InputJsonValue;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.auditLog.create({
      data: {
        actorUserId: data.actorUserId || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        beforeState: data.beforeState ?? Prisma.JsonNull,
        afterState: data.afterState ?? Prisma.JsonNull,
      },
    });
  }

  async findAll(filters: {
    entityType?: string;
    entityId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
