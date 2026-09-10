import { Injectable } from '@nestjs/common';
import { BatchesService } from '../batches/batches.service';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransportDto } from './dto/create-transport.dto';

@Injectable()
export class TransportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batches: BatchesService,
  ) {}

  async list(batchIdOrCode: string) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const rows = await this.prisma.transport.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true },
    });
    return serialize(rows);
  }

  async create(batchIdOrCode: string, dto: CreateTransportDto) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const row = await this.prisma.transport.create({
      data: {
        batchId: batch.id,
        transportType: dto.transportType,
        carrier: dto.carrier,
        vehicleId: dto.vehicleId,
        vehicleRef: dto.vehicleRef,
        origin: dto.origin,
        destination: dto.destination,
        departureAt: dto.departureAt ? new Date(dto.departureAt) : undefined,
        arrivalAt: dto.arrivalAt ? new Date(dto.arrivalAt) : undefined,
        status: dto.status ?? 'PLANNED',
        isDemo: true,
      },
      include: { vehicle: true },
    });
    return serialize(row);
  }
}
