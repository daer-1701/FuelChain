import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAnomalyDto,
  ListAnomaliesQueryDto,
  UpdateAnomalyStatusDto,
} from './dto/anomaly.dto';

@Injectable()
export class AnomaliesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListAnomaliesQueryDto) {
    const where: Prisma.AnomalyWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.batchId) where.batchId = query.batchId;

    const rows = await this.prisma.anomaly.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          select: {
            batchCode: true,
            product: true,
            riskLevel: true,
            riskScore: true,
          },
        },
      },
    });
    return serialize({ label: 'DEMO', data: rows });
  }

  async findOne(id: string) {
    const row = await this.prisma.anomaly.findUnique({
      where: { id },
      include: {
        batch: true,
        auditCases: true,
      },
    });
    if (!row) throw new NotFoundException(`Anomaly not found: ${id}`);
    return serialize(row);
  }

  async create(dto: CreateAnomalyDto) {
    const row = await this.prisma.anomaly.create({
      data: {
        batchId: dto.batchId,
        type: dto.type,
        severity: dto.severity ?? 'MEDIUM',
        expected: dto.expected,
        actual: dto.actual,
        difference: dto.difference,
        riskImpact: dto.riskImpact ?? 0,
        explanation:
          dto.explanation ??
          'ANOMALY / DISCREPANCY signal for human audit. Not an automatic finding of theft or corruption.',
        isDemo: true,
      },
    });
    return serialize(row);
  }

  async updateStatus(id: string, dto: UpdateAnomalyStatusDto) {
    const row = await this.prisma.anomaly.update({
      where: { id },
      data: { status: dto.status },
    });
    return serialize(row);
  }
}
