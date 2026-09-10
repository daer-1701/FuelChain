import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return serialize(rows);
  }

  async create(dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { identifier: dto.identifier },
    });
    if (existing) {
      throw new ConflictException(`Vehicle already exists: ${dto.identifier}`);
    }

    const row = await this.prisma.vehicle.create({
      data: {
        identifier: dto.identifier,
        plate: dto.plate,
        carrier: dto.carrier,
        capacityLiters:
          dto.capacityLiters !== undefined
            ? new Prisma.Decimal(dto.capacityLiters)
            : undefined,
        status: dto.status ?? 'ACTIVE',
        isDemo: true,
      },
    });
    return serialize(row);
  }
}
