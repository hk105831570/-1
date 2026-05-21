import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperationLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    operatorId: number;
    operatorType: 'employee' | 'admin';
    actionType: string;
    target?: string;
    detail?: string;
    ip?: string;
  }) {
    return this.prisma.operationLog.create({
      data: params,
    });
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    operatorId?: number;
    actionType?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    const { page = 1, pageSize = 20, operatorId, actionType, startTime, endTime } = params;
    const where: any = {};
    if (operatorId) where.operatorId = operatorId;
    if (actionType) where.actionType = actionType;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt.gte = startTime;
      if (endTime) where.createdAt.lte = endTime;
    }

    const [items, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
