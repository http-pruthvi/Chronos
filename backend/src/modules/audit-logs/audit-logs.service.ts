import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLogsRepository } from './audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async log(
    data: {
      actorUserId?: string | null;
      action: string;
      entityType: string;
      entityId: string;
      beforeState?: any;
      afterState?: any;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.auditLogsRepository.create(data, tx);
  }

  async findAll(query: {
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Number(query.limit || 10));
    const skip = (page - 1) * limit;

    const { items, total } = await this.auditLogsRepository.findAll({
      entityType: query.entityType,
      entityId: query.entityId,
      skip,
      take: limit,
    });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
      },
    };
  }
}
