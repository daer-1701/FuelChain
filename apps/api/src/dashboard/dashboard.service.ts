import { Injectable } from '@nestjs/common';
import { BatchStatus, Prisma, RiskLevel } from '@prisma/client';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis() {
    const [
      totalBatches,
      inTransit,
      delivered,
      certified,
      auditRequired,
      highRisk,
      volumeAgg,
      openAnomalies,
    ] = await Promise.all([
      this.prisma.fuelBatch.count(),
      this.prisma.fuelBatch.count({
        where: { status: { in: [BatchStatus.IN_TRANSIT, BatchStatus.AT_BORDER] } },
      }),
      this.prisma.fuelBatch.count({
        where: { status: { in: [BatchStatus.DELIVERED, BatchStatus.COMPLETED] } },
      }),
      this.prisma.fuelBatch.count({
        where: { qualityStatus: 'CERTIFIED' },
      }),
      this.prisma.fuelBatch.count({
        where: { status: BatchStatus.AUDIT_REQUIRED },
      }),
      this.prisma.fuelBatch.count({
        where: { riskLevel: RiskLevel.HIGH },
      }),
      this.prisma.fuelBatch.aggregate({
        _sum: { declaredVolumeLiters: true },
      }),
      this.prisma.anomaly.count({
        where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      }),
    ]);

    const recentBatches = await this.prisma.fuelBatch.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        custodyEvents: { orderBy: { timestamp: 'desc' }, take: 1 },
        anomalies: { where: { status: 'OPEN' }, take: 1 },
      },
    });

    const recentAnomalies = await this.prisma.anomaly.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { batch: { select: { batchCode: true, product: true } } },
    });

    return serialize({
      label: 'DEMO',
      kpis: {
        totalBatches,
        inTransit,
        delivered,
        certified,
        auditRequired,
        highRisk,
        totalVolumeLiters: volumeAgg._sum.declaredVolumeLiters ?? new Prisma.Decimal(0),
        discrepancies: openAnomalies,
      },
      recentBatches,
      recentAnomalies,
    });
  }
}
