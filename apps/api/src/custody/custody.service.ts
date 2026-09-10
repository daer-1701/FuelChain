import { Injectable } from '@nestjs/common';
import { BatchStatus, Prisma } from '@prisma/client';
import { BatchesService } from '../batches/batches.service';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustodyEventDto } from './dto/create-custody-event.dto';

const EVENT_TO_STATUS: Partial<Record<CreateCustodyEventDto['eventType'], BatchStatus>> = {
  IN_TRANSIT: BatchStatus.IN_TRANSIT,
  ENTERED_COUNTRY: BatchStatus.AT_BORDER,
  CUSTOMS: BatchStatus.CUSTOMS,
  RECEIVED: BatchStatus.RECEIVED,
  SAMPLED: BatchStatus.SAMPLING,
  LAB_ANALYSIS: BatchStatus.LAB_ANALYSIS,
  CERTIFIED: BatchStatus.CERTIFIED,
  STORED: BatchStatus.STORED,
  DISPATCHED: BatchStatus.DISTRIBUTING,
  DELIVERED: BatchStatus.DELIVERED,
};

@Injectable()
export class CustodyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batches: BatchesService,
  ) {}

  async list(batchIdOrCode: string) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const events = await this.prisma.custodyEvent.findMany({
      where: { batchId: batch.id },
      orderBy: { timestamp: 'asc' },
      include: { actor: true },
    });
    return serialize(events);
  }

  async create(batchIdOrCode: string, dto: CreateCustodyEventDto) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.custodyEvent.create({
        data: {
          batchId: batch.id,
          eventType: dto.eventType,
          actorId: dto.actorId,
          location: dto.location,
          declaredVolume:
            dto.declaredVolume !== undefined
              ? new Prisma.Decimal(dto.declaredVolume)
              : undefined,
          measuredVolume:
            dto.measuredVolume !== undefined
              ? new Prisma.Decimal(dto.measuredVolume)
              : undefined,
          evidenceHash: dto.evidenceHash,
          transactionHash: dto.transactionHash,
          metadata: (dto.metadata ?? { label: 'DEMO' }) as Prisma.InputJsonValue,
          isDemo: true,
        },
      });

      // Soft status mapping for demo flow
      const nextStatus = EVENT_TO_STATUS[dto.eventType];
      if (nextStatus || dto.location) {
        await tx.fuelBatch.update({
          where: { id: batch.id },
          data: {
            ...(nextStatus ? { status: nextStatus } : {}),
            ...(dto.location ? { currentLocation: dto.location } : {}),
          },
        });
      }

      return created;
    });

    return serialize(event);
  }
}
