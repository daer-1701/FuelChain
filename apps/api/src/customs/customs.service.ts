import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BatchesService } from '../batches/batches.service';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomsEventDto } from './dto/create-customs-event.dto';

@Injectable()
export class CustomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batches: BatchesService,
  ) {}

  async list(batchIdOrCode: string) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const rows = await this.prisma.customsEvent.findMany({
      where: { batchId: batch.id },
      orderBy: { timestamp: 'asc' },
    });
    return serialize(rows);
  }

  async create(batchIdOrCode: string, dto: CreateCustomsEventDto) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customsEvent.create({
        data: {
          batchId: batch.id,
          eventType: dto.eventType,
          location: dto.location,
          declaredVolume:
            dto.declaredVolume !== undefined
              ? new Prisma.Decimal(dto.declaredVolume)
              : undefined,
          measuredVolume:
            dto.measuredVolume !== undefined
              ? new Prisma.Decimal(dto.measuredVolume)
              : undefined,
          actorId: dto.actorId,
          documentId: dto.documentId,
          isDemo: true,
        },
      });

      await tx.custodyEvent.create({
        data: {
          batchId: batch.id,
          eventType: 'CUSTOMS',
          location: dto.location,
          declaredVolume:
            dto.declaredVolume !== undefined
              ? new Prisma.Decimal(dto.declaredVolume)
              : undefined,
          measuredVolume:
            dto.measuredVolume !== undefined
              ? new Prisma.Decimal(dto.measuredVolume)
              : undefined,
          metadata: {
            label: 'DEMO',
            customsEventId: created.id,
            customsEventType: dto.eventType,
          },
          isDemo: true,
        },
      });

      await tx.fuelBatch.update({
        where: { id: batch.id },
        data: {
          status: 'CUSTOMS',
          currentLocation: dto.location,
        },
      });

      return created;
    });

    return serialize(row);
  }
}
