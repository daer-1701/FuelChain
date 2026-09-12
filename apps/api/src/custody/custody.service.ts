import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { BatchStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
import { BatchesService } from '../batches/batches.service';
import { assertCanTransition, canReceiveBatch } from '../common/batch-status';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustodyEventDto } from './dto/create-custody-event.dto';
import { ReceivedFollowUpService } from './received-follow-up.service';

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
    @Optional() private readonly followUp?: ReceivedFollowUpService,
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

  async create(
    batchIdOrCode: string,
    dto: CreateCustodyEventDto,
    actor: AuthUser,
  ) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    if (dto.eventType === 'RECEIVED' && !canReceiveBatch(batch.status)) {
      throw new BadRequestException(
        `Recepción no permitida desde estado ${batch.status}. El lote debe estar en tránsito.`,
      );
    }
    const nextStatus = EVENT_TO_STATUS[dto.eventType];
    if (nextStatus) {
      assertCanTransition(batch.status, nextStatus);
    }

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.custodyEvent.create({
        data: {
          batchId: batch.id,
          eventType: dto.eventType,
          actorId: actor.id,
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

    if (dto.eventType === 'RECEIVED' && this.followUp) {
      const follow = await this.followUp.afterReceived(event, batch);
      return serialize({
        ...event,
        movement: follow.reconciliation,
        anomaly: follow.anomaly,
        blockchain: follow.blockchain,
      });
    }

    return serialize(event);
  }
}
