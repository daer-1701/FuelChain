import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeasurementDto, CreateTankDto } from './dto/tanks.dto';

@Injectable()
export class TanksService {
  constructor(private readonly prisma: PrismaService) {}

  async listTanks() {
    const rows = await this.prisma.storageTank.findMany({
      orderBy: { name: 'asc' },
      include: {
        measurements: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });
    return serialize(rows);
  }

  async createTank(dto: CreateTankDto) {
    const row = await this.prisma.storageTank.create({
      data: {
        name: dto.name,
        capacityLiters: new Prisma.Decimal(dto.capacityLiters),
        location: dto.location,
        status: dto.status ?? 'AVAILABLE',
        isDemo: true,
      },
    });
    return serialize(row);
  }

  async listMeasurements(tankId?: string, batchId?: string) {
    const rows = await this.prisma.measurement.findMany({
      where: {
        ...(tankId ? { tankId } : {}),
        ...(batchId ? { batchId } : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: { tank: true, batch: { select: { batchCode: true } } },
    });
    return serialize(rows);
  }

  async createMeasurement(dto: CreateMeasurementDto) {
    const tank = await this.prisma.storageTank.findUnique({
      where: { id: dto.tankId },
    });
    if (!tank) throw new NotFoundException(`Tank not found: ${dto.tankId}`);

    const row = await this.prisma.measurement.create({
      data: {
        tankId: dto.tankId,
        batchId: dto.batchId,
        deviceId: dto.deviceId,
        volumeLiters: new Prisma.Decimal(dto.volumeLiters),
        temperature:
          dto.temperature !== undefined
            ? new Prisma.Decimal(dto.temperature)
            : undefined,
        latitude:
          dto.latitude !== undefined ? new Prisma.Decimal(dto.latitude) : undefined,
        longitude:
          dto.longitude !== undefined
            ? new Prisma.Decimal(dto.longitude)
            : undefined,
        source: dto.source,
        isDemo: true,
      },
    });
    return serialize(row);
  }
}
