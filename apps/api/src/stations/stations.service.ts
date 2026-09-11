import { Injectable } from '@nestjs/common';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(city = 'Cochabamba') {
    const rows = await this.prisma.station.findMany({
      where: { city, publicVisible: true },
      orderBy: { name: 'asc' },
      include: {
        tanks: {
          include: {
            measurements: { orderBy: { timestamp: 'desc' }, take: 1 },
          },
        },
      },
    });

    return serialize({
      label: 'DEMO',
      city,
      note: 'Disponibilidad agregada para ciudadanos. No muestra litros exactos.',
      data: rows.map((s) => {
        const tank = s.tanks[0];
        const last = tank?.measurements[0];
        const capacity = tank ? Number(tank.capacityLiters.toString()) : null;
        const volume = last ? Number(last.volumeLiters.toString()) : null;
        return {
          code: s.code,
          name: s.name,
          municipality: s.municipality,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          availability: s.availability,
          products: s.products,
          lastInventoryAt: s.lastInventoryAt,
          publicLevel:
            s.availability === 'FULL'
              ? 'Lleno'
              : s.availability === 'MEDIUM'
                ? 'Medio'
                : s.availability === 'LOW'
                  ? 'Bajo'
                  : s.availability === 'EMPTY'
                    ? 'Sin stock'
                    : 'Sin dato',
          tankName: tank?.name ?? null,
          fillPercent:
            capacity && volume != null
              ? Math.round(Math.min(100, (volume / capacity) * 100))
              : null,
          waterDetected: last?.waterDetected ?? false,
          temperature: last?.temperature ?? null,
        };
      }),
    });
  }

  async listAll() {
    const rows = await this.prisma.station.findMany({
      orderBy: { code: 'asc' },
      include: { tanks: true },
    });
    return serialize({ label: 'DEMO', data: rows });
  }
}
