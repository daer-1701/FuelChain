import { BadRequestException, Injectable } from '@nestjs/common';
import { ActorRole, Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
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

/** Quita sufijo DEMO de textos visibles al ciudadano. */
function publicLabel(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace(/\s*\(DEMO\)\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim();
}

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeCityFilter(city?: string): string | undefined {
    if (!city || city === 'all' || city === 'Bolivia' || city === '*') {
      return undefined;
    }
    return city;
  }

  /** Departamentos de toda la red (independiente del filtro activo). */
  private async listDepartmentCities(): Promise<string[]> {
    const rows = await this.prisma.station.findMany({
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return rows.map((r) => r.city).sort((a, b) => a.localeCompare(b, 'es'));
  }

  async listPublic(city?: string) {
    const cityFilter = this.normalizeCityFilter(city);
    const [rows, departments] = await Promise.all([
      this.prisma.station.findMany({
        where: {
          publicVisible: true,
          ...(cityFilter ? { city: cityFilter } : {}),
        },
        orderBy: [{ city: 'asc' }, { name: 'asc' }],
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
      }),
      this.listDepartmentCities(),
    ]);

    return serialize({
      label: 'DEMO',
      city: cityFilter ?? 'Bolivia',
      departments,
      note:
        'Semáforo de cantidad + calidad por departamento. Datos DEMO Bolivia.',
      data: rows.map((s) => {
        const tank = s.tanks[0];
        const last = tank?.measurements[0];
        const lastDelivery = s.deliveries[0];
        const batch = lastDelivery?.batch;
        const capacity =
          s.tanks.length > 0
            ? s.tanks.reduce(
                (acc, t) => acc + Number(t.capacityLiters.toString()),
                0,
              )
            : null;
        const stock =
          s.tanks.length > 0
            ? s.tanks.reduce(
                (acc, t) => acc + Number(t.currentStockLiters.toString()),
                0,
              )
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
          name: publicLabel(s.name) ?? s.name,
          city: s.city,
          municipality: s.municipality,
          address: publicLabel(s.address) ?? s.address,
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
          stockLiters: stock != null ? Math.round(stock) : null,
          capacityLiters: capacity != null ? Math.round(capacity) : null,
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
    city?: string,
    opts?: { stationId?: string; includeFleet?: boolean },
  ) {
    const cityFilter = this.normalizeCityFilter(city);
    const stationFilter = opts?.stationId
      ? {
          id: opts.stationId,
          ...(cityFilter ? { city: cityFilter } : {}),
        }
      : cityFilter
        ? { city: cityFilter }
        : {};
    const includeFleet = opts?.includeFleet !== false && !opts?.stationId;

    const [stations, fleet, departments] = await Promise.all([
      this.prisma.station.findMany({
        where: stationFilter,
        orderBy: [{ city: 'asc' }, { code: 'asc' }],
        include: {
          tanks: {
            include: {
              measurements: { orderBy: { timestamp: 'desc' }, take: 1 },
            },
          },
          deliveries: {
            orderBy: [{ deliveredAt: 'desc' }, { loadedAt: 'desc' }],
            take: 8,
            include: {
              batch: true,
              cistern: true,
              checkpoints: {
                orderBy: { capturedAt: 'asc' },
                take: 6,
              },
            },
          },
        },
      }),
      includeFleet
        ? this.prisma.cistern.findMany({
            orderBy: { code: 'asc' },
          })
        : Promise.resolve([]),
      this.listDepartmentCities(),
    ]);

    if (opts?.stationId && stations.length === 0) {
      return serialize({
        label: 'DEMO',
        city: cityFilter ?? 'Bolivia',
        departments,
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
      const capacity = s.tanks.reduce(
        (acc, t) => acc + Number(t.capacityLiters.toString()),
        0,
      );
      const stock = s.tanks.reduce(
        (acc, t) => acc + Number(t.currentStockLiters.toString()),
        0,
      );
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
          name: publicLabel(s.name) ?? s.name,
          city: s.city,
          municipality: s.municipality,
          address: publicLabel(s.address) ?? s.address,
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
          checkpoints: d.checkpoints.map((c) => ({
            id: c.id,
            kind: c.kind,
            label: c.label,
            volumeLiters: Number(c.volumeLiters.toString()),
            latitude: c.latitude,
            longitude: c.longitude,
            capturedAt: c.capturedAt,
            waterDetected: c.waterDetected,
          })),
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
      city: cityFilter ?? 'Bolivia',
      departments,
      note:
        'Panel de supervisión FuelChain Bolivia. ANH ve cantidad, calidad y cisternas por surtidor. No es el sistema oficial ANH.',
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

  /**
   * Contratos DEMO surtidor ↔ chofer derivados de entregas (Delivery).
   * Estación: entregas a su EESS. Chofer: entregas de su cisterna.
   */
  async listContractsForActor(user: AuthUser) {
    let where: Prisma.DeliveryWhereInput = { cistern: { driverId: user.id } };
    if (user.role === ActorRole.STATION_STAFF && user.stationId) {
      where = { destinationStationId: user.stationId };
    } else if (user.cisternCode) {
      where = { cistern: { code: user.cisternCode } };
    } else if (user.role === ActorRole.ADMIN) {
      where = {};
    }

    const rows = await this.prisma.delivery.findMany({
      where,
      orderBy: [{ loadedAt: 'desc' }],
      take: 20,
      include: {
        batch: true,
        cistern: { include: { driver: true } },
        station: true,
      },
    });

    return serialize({
      label: 'DEMO',
      note:
        'Contrato de entrega DEMO entre surtidor y chofer (derivado del despacho). Cada parte puede acusar el acuerdo.',
      data: rows.map((d) => ({
        id: d.id,
        title: `Entrega ${d.cistern.code} → ${d.station.code}`,
        status: d.status,
        batchCode: d.batch.batchCode,
        product: d.batch.product,
        cisternCode: d.cistern.code,
        driverName: d.cistern.driver?.name ?? 'Chofer DEMO',
        stationCode: d.station.code,
        stationName: d.station.name,
        loadedLiters: Number(d.loadedLiters.toString()),
        receivedLiters:
          d.receivedLiters != null
            ? Number(d.receivedLiters.toString())
            : null,
        qualityOk: !d.loadWaterDetected && !d.receivedWaterDetected,
        loadedAt: d.loadedAt,
        deliveredAt: d.deliveredAt,
        batonTokenId: d.batonTokenId,
        stationAckAt: d.stationContractAckAt,
        driverAckAt: d.driverContractAckAt,
        parties: {
          station: d.station.name,
          driver: d.cistern.driver?.name ?? 'Chofer DEMO',
          carrier: d.cistern.carrier,
        },
      })),
    });
  }

  async ackContract(deliveryId: string, user: AuthUser) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        cistern: true,
        station: true,
      },
    });
    if (!delivery) {
      throw new BadRequestException('Contrato / entrega no encontrada');
    }

    const now = new Date();
    if (user.role === ActorRole.STATION_STAFF) {
      if (!user.stationId || delivery.destinationStationId !== user.stationId) {
        throw new BadRequestException(
          'Solo podés acusar contratos de tu estación',
        );
      }
      const updated = await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { stationContractAckAt: now },
      });
      return serialize({
        label: 'DEMO',
        note: 'Estación acusó el contrato de entrega.',
        data: { id: updated.id, stationAckAt: updated.stationContractAckAt },
      });
    }

    if (
      user.role === ActorRole.TRANSPORTER ||
      user.role === ActorRole.DEPOT_OPERATOR
    ) {
      const owns =
        delivery.cistern.driverId === user.id ||
        (user.cisternCode && delivery.cistern.code === user.cisternCode);
      if (!owns) {
        throw new BadRequestException(
          'Solo podés acusar contratos de tu cisterna',
        );
      }
      const updated = await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { driverContractAckAt: now },
      });
      return serialize({
        label: 'DEMO',
        note: 'Chofer acusó el contrato de entrega.',
        data: { id: updated.id, driverAckAt: updated.driverContractAckAt },
      });
    }

    if (user.role === ActorRole.ADMIN) {
      const updated = await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          stationContractAckAt: delivery.stationContractAckAt ?? now,
          driverContractAckAt: delivery.driverContractAckAt ?? now,
        },
      });
      return serialize({
        label: 'DEMO',
        note: 'Admin acusó el contrato.',
        data: {
          id: updated.id,
          stationAckAt: updated.stationContractAckAt,
          driverAckAt: updated.driverContractAckAt,
        },
      });
    }

    throw new BadRequestException('Tu rol no acusa contratos');
  }

  /** Opcional: consumo DEMO si DEMO_IDLE_CONSUMPTION=1 (apagado por defecto). */
  private async applyIdleConsumption(city?: string) {
    if (process.env.DEMO_IDLE_CONSUMPTION !== '1') return;
    const tanks = await this.prisma.storageTank.findMany({
      where: city ? { station: { city } } : { stationId: { not: null } },
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

  /**
   * Informe público para portal Unlock (token-gated en el cliente).
   * Solo datos DEMO de cantidad/calidad por tramo — sin PII sensible.
   */
  async listUnlockReport() {
    const deliveries = await this.prisma.delivery.findMany({
      orderBy: [{ deliveredAt: 'desc' }, { loadedAt: 'desc' }],
      take: 24,
      include: {
        batch: true,
        cistern: true,
        station: true,
        checkpoints: { orderBy: { capturedAt: 'asc' }, take: 8 },
      },
    });
    const stationCount = await this.prisma.station.count();
    const openDeliveries = deliveries.filter((d) =>
      ['LOADED', 'IN_TRANSIT'].includes(d.status),
    ).length;
    let checkpoints = 0;
    let qualityAlerts = 0;

    const journeys = deliveries.map((d) => {
      checkpoints += d.checkpoints.length;
      const water =
        d.loadWaterDetected ||
        d.receivedWaterDetected ||
        d.checkpoints.some((c) => c.waterDetected);
      if (water) qualityAlerts += 1;
      return {
        deliveryId: d.id,
        status: d.status,
        cisternCode: d.cistern.code,
        stationCode: d.station.code,
        stationName: publicLabel(d.station.name) ?? d.station.name,
        batchCode: d.batch.batchCode,
        product: d.batch.product,
        loadedLiters: Number(d.loadedLiters.toString()),
        receivedLiters:
          d.receivedLiters != null
            ? Number(d.receivedLiters.toString())
            : null,
        loadDensity:
          d.loadDensity != null ? Number(d.loadDensity.toString()) : null,
        loadTemperature:
          d.loadTemperature != null
            ? Number(d.loadTemperature.toString())
            : null,
        loadWaterDetected: d.loadWaterDetected,
        receivedDensity:
          d.receivedDensity != null
            ? Number(d.receivedDensity.toString())
            : null,
        receivedTemperature:
          d.receivedTemperature != null
            ? Number(d.receivedTemperature.toString())
            : null,
        receivedWaterDetected: d.receivedWaterDetected,
        checkpoints: d.checkpoints.map((c) => ({
          kind: c.kind,
          volumeLiters: Number(c.volumeLiters.toString()),
          density: c.density != null ? Number(c.density.toString()) : null,
          temperature:
            c.temperature != null ? Number(c.temperature.toString()) : null,
          waterDetected: c.waterDetected,
          capturedAt: c.capturedAt,
          label: c.label,
        })),
      };
    });

    return {
      label: 'DEMO',
      note:
        'Informe DEMO desbloqueado con Key Unlock. Cantidad y calidad por tramo del camino. No es dato oficial ANH.',
      unlockedBy: 'unlock-protocol',
      data: {
        summary: {
          stations: stationCount,
          openDeliveries,
          checkpoints,
          qualityAlerts,
        },
        journeys,
      },
    };
  }
}
