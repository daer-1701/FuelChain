import { Injectable } from '@nestjs/common';
import { serialize } from '../common/serialize';
import {
  applyStockWithdraw,
  availabilityFromFillRatio,
  demoConsumptionLiters,
} from '../common/tank-inventory';
import { PrismaService } from '../prisma/prisma.service';
import {
  assessStationQuality,
  publicLevelFromAvailability,
} from './station-quality';

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(city = 'Cochabamba') {
    await this.applyIdleConsumption(city);
    const rows = await this.prisma.station.findMany({
      where: { city, publicVisible: true },
      orderBy: { name: 'asc' },
      include: {
        tanks: {
          include: {
            measurements: { orderBy: { timestamp: 'desc' }, take: 1 },
          },
        },
        deliveries: {
          where: { status: 'DELIVERED' },
          orderBy: { deliveredAt: 'desc' },
          take: 1,
          include: { batch: true, cistern: true },
        },
      },
    });

    return serialize({
      label: 'DEMO',
      city,
      note:
        'Semáforo de cantidad + calidad agregada para ciudadanos. Datos DEMO.',
      data: rows.map((s) => {
        const tank = s.tanks[0];
        const last = tank?.measurements[0];
        const lastDelivery = s.deliveries[0];
        const batch = lastDelivery?.batch;
        const capacity = tank
          ? Number(tank.capacityLiters.toString())
          : null;
        const stock = tank
          ? Number(tank.currentStockLiters.toString())
          : last
            ? Number(last.volumeLiters.toString())
            : null;
        const fillRatio =
          capacity && stock != null && capacity > 0 ? stock / capacity : 0;
        const availability = tank
          ? availabilityFromFillRatio(fillRatio)
          : s.availability;
        const quality = assessStationQuality({
          waterDetected:
            lastDelivery?.receivedWaterDetected ?? last?.waterDetected,
          density:
            lastDelivery?.receivedDensity != null
              ? Number(lastDelivery.receivedDensity.toString())
              : last?.density != null
                ? Number(last.density.toString())
                : null,
          temperature:
            lastDelivery?.receivedTemperature != null
              ? Number(lastDelivery.receivedTemperature.toString())
              : last?.temperature != null
                ? Number(last.temperature.toString())
                : null,
          batchCode: batch?.batchCode,
          batchQualityStatus: batch?.qualityStatus,
          certificateStatus: lastDelivery?.loadCertificateStatus,
        });

        return {
          code: s.code,
          name: s.name,
          municipality: s.municipality,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          availability,
          products: s.products,
          lastInventoryAt: s.lastInventoryAt,
          publicLevel: publicLevelFromAvailability(availability),
          quantityLabel: publicLevelFromAvailability(availability),
          qualityTone: quality.tone,
          qualityLabel: quality.label,
          tankName: tank?.name ?? null,
          fillPercent:
            capacity && stock != null
              ? Math.round(Math.min(100, (stock / capacity) * 100))
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

  /**
   * ANH / auditor: toda la red.
   * Estación: solo su surtidor (stationId) — sin flota ajena.
   */
  async listSupervision(
    city = 'Cochabamba',
    opts?: { stationId?: string; includeFleet?: boolean },
  ) {
    await this.applyIdleConsumption(city);
    const stationFilter = opts?.stationId
      ? { city, id: opts.stationId }
      : { city };
    const includeFleet = opts?.includeFleet !== false && !opts?.stationId;

    const [stations, fleet] = await Promise.all([
      this.prisma.station.findMany({
        where: stationFilter,
        orderBy: { code: 'asc' },
        include: {
          tanks: {
            include: {
              measurements: { orderBy: { timestamp: 'desc' }, take: 1 },
            },
          },
          deliveries: {
            orderBy: [{ deliveredAt: 'desc' }, { loadedAt: 'desc' }],
            take: 8,
            include: { batch: true, cistern: true },
          },
        },
      }),
      includeFleet
        ? this.prisma.cistern.findMany({
            orderBy: { code: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    if (opts?.stationId && stations.length === 0) {
      return serialize({
        label: 'DEMO',
        city,
        note: 'Sin estación asignada o no encontrada.',
        summary: {
          stations: 0,
          lowStock: 0,
          qualityAlerts: 0,
          fleetCisterns: 0,
        },
        data: [],
        fleetCisterns: [],
      });
    }
    const data = stations.map((s) => {
      const tank = s.tanks[0];
      const last = tank?.measurements[0];
      const latestDelivery =
        s.deliveries.find((d) => d.status === 'DELIVERED') ?? s.deliveries[0];
      const batch = latestDelivery?.batch;
      const capacity = tank ? Number(tank.capacityLiters.toString()) : 0;
      const stock = tank ? Number(tank.currentStockLiters.toString()) : 0;
      const fillPercent =
        capacity > 0
          ? Math.round(Math.min(100, (stock / capacity) * 100))
          : null;

      const availability = availabilityFromFillRatio(
        capacity > 0 ? stock / capacity : 0,
      );
      const quality = assessStationQuality({
        waterDetected:
          latestDelivery?.receivedWaterDetected ?? last?.waterDetected,
        density:
          latestDelivery?.receivedDensity != null
            ? Number(latestDelivery.receivedDensity.toString())
            : last?.density != null
              ? Number(last.density.toString())
              : null,
        temperature:
          latestDelivery?.receivedTemperature != null
            ? Number(latestDelivery.receivedTemperature.toString())
            : last?.temperature != null
              ? Number(last.temperature.toString())
              : null,
        batchCode: batch?.batchCode,
        batchQualityStatus: batch?.qualityStatus,
        certificateStatus: latestDelivery?.loadCertificateStatus,
      });

      return {
        code: s.code,
        name: s.name,
        municipality: s.municipality,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        availability,
        products: s.products,
        lastInventoryAt: s.lastInventoryAt,
        quantity: {
          stockLiters: stock,
          capacityLiters: capacity,
          fillPercent,
          publicLevel: publicLevelFromAvailability(availability),
        },
        quality,
        tanks: s.tanks.map((t) => {
          const m = t.measurements[0];
          const cap = Number(t.capacityLiters.toString());
          const cur = Number(t.currentStockLiters.toString());
          return {
            id: t.id,
            name: t.name,
            cisternCode: t.cisternCode,
            status: t.status,
            capacityLiters: cap,
            currentStockLiters: cur,
            fillPercent:
              cap > 0 ? Math.round(Math.min(100, (cur / cap) * 100)) : null,
            lastMeasurement: m
              ? {
                  volumeLiters: Number(m.volumeLiters.toString()),
                  temperature:
                    m.temperature != null
                      ? Number(m.temperature.toString())
                      : null,
                  density:
                    m.density != null ? Number(m.density.toString()) : null,
                  waterDetected: m.waterDetected,
                  timestamp: m.timestamp,
                  source: m.source,
                }
              : null,
          };
        }),
        cisterns: s.deliveries.map((d) => ({
          tokenId: d.batonTokenId ?? d.id,
          cisternCode: d.cistern.code,
          eventType: d.status,
          status: d.status,
          volumeLiters: Number(
            (d.receivedLiters ?? d.loadedLiters).toString(),
          ),
          batchCode: d.batch.batchCode,
          product: d.batch.product,
          batchQualityStatus: d.batch.qualityStatus,
          issuedAt: d.loadedAt,
          consumedAt: d.deliveredAt,
        })),
      };
    });

    const qualityAlerts = data.filter(
      (d) => d.quality.tone === 'ALERTA' || d.quality.tone === 'RECHAZADO',
    ).length;
    const lowStock = data.filter(
      (d) =>
        d.availability === 'LOW' ||
        d.availability === 'EMPTY' ||
        (d.quantity.fillPercent != null && d.quantity.fillPercent < 25),
    ).length;

    return serialize({
      label: 'DEMO',
      city,
      note:
        'Panel de supervisión FuelChain. ANH ve cantidad, calidad y cisternas por surtidor. No es el sistema oficial ANH.',
      summary: {
        stations: data.length,
        lowStock,
        qualityAlerts,
        fleetCisterns: fleet.length,
      },
      data,
      fleetCisterns: fleet.map((c) => ({
        cisternCode: c.code,
        name: c.code,
        status: c.status,
        capacityLiters: Number(c.capacityLiters.toString()),
        currentStockLiters: Number(c.currentLoadLiters.toString()),
        location: `${c.carrier} · ${c.plate ?? c.code}`,
      })),
    });
  }

  /** DEMO: ventas diarias ~2% capacidad para que el stock no solo suba. */
  private async applyIdleConsumption(city: string) {
    const tanks = await this.prisma.storageTank.findMany({
      where: { station: { city } },
      include: { station: { select: { lastInventoryAt: true } } },
    });
    const now = new Date();
    for (const tank of tanks) {
      const stock = Number(tank.currentStockLiters.toString());
      const cap = Number(tank.capacityLiters.toString());
      const burn = demoConsumptionLiters({
        stockLiters: stock,
        capacityLiters: cap,
        lastInventoryAt: tank.station?.lastInventoryAt ?? tank.updatedAt,
        now,
      });
      if (burn < 1) continue;
      const next = applyStockWithdraw({
        previousStock: tank.currentStockLiters,
        withdrawLiters: burn,
        capacityLiters: tank.capacityLiters,
      });
      await this.prisma.storageTank.update({
        where: { id: tank.id },
        data: { currentStockLiters: next.nextStock },
      });
      if (tank.stationId) {
        await this.prisma.station.update({
          where: { id: tank.stationId },
          data: {
            availability: next.availability,
            lastInventoryAt: now,
          },
        });
      }
    }
  }
}
