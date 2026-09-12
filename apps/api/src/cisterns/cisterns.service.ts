import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorRole, Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
import {
  computeQualityChanges,
  computeVolumeDrops,
  decimalOrUndef,
  normalizeCheckpointKind,
  parseJourneyTrail,
  type JourneySampleInput,
} from '../common/journey-trail';
import { serialize } from '../common/serialize';
import { applyStockDelta, applyStockWithdraw } from '../common/tank-inventory';
import { PrismaService } from '../prisma/prisma.service';
import { settlementCreateData } from '../settlements/settlement-math';

@Injectable()
export class CisternsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCistern(tokenOrCode: string) {
    const key = tokenOrCode.trim();
    const cistern = await this.prisma.cistern.findFirst({
      where: {
        OR: [{ qrToken: key }, { code: key }, { deviceId: key }],
      },
      include: {
        driver: { select: { id: true, name: true, email: true } },
        currentBatch: {
          select: { id: true, batchCode: true, product: true, status: true },
        },
      },
    });
    if (!cistern) throw new NotFoundException('Cisterna / QR no encontrado');
    return cistern;
  }

  private async activeDelivery(cisternId: string) {
    return this.prisma.delivery.findFirst({
      where: {
        cisternId,
        status: { in: ['LOADED', 'IN_TRANSIT'] },
      },
      orderBy: { loadedAt: 'desc' },
      include: {
        batch: {
          select: {
            id: true,
            batchCode: true,
            product: true,
            status: true,
            declaredVolumeLiters: true,
          },
        },
        station: {
          select: { id: true, code: true, name: true, latitude: true, longitude: true },
        },
      },
    });
  }

  private async journeyFor(
    cisternId: string,
    deliveryId?: string | null,
    batchId?: string | null,
  ) {
    const where: Prisma.RouteCheckpointWhereInput = deliveryId
      ? { deliveryId }
      : batchId
        ? { cisternId, batchId }
        : { cisternId };
    return this.prisma.routeCheckpoint.findMany({
      where,
      orderBy: { capturedAt: 'asc' },
      take: 80,
    });
  }

  /** Sticker permanente: /c/{qrToken} */
  async getByQr(tokenOrCode: string) {
    const cistern = await this.resolveCistern(tokenOrCode);
    const delivery = await this.activeDelivery(cistern.id);
    const checkpoints = await this.journeyFor(
      cistern.id,
      delivery?.id,
      delivery?.batchId ?? cistern.currentBatchId,
    );
    const volumeDrops = computeVolumeDrops(checkpoints);
    const qualityChanges = computeQualityChanges(checkpoints);

    return serialize({
      label: 'DEMO',
      note:
        'QR físico de cisterna (sticker). Asociado al gateway del dispositivo. Al escanear en estación se sube el camino.',
      data: {
        cistern: {
          id: cistern.id,
          code: cistern.code,
          qrToken: cistern.qrToken,
          deviceId: cistern.deviceId,
          plate: cistern.plate,
          carrier: cistern.carrier,
          status: cistern.status,
          currentLoadLiters: cistern.currentLoadLiters,
          driver: cistern.driver,
          currentBatch: cistern.currentBatch,
          deepLinkPath: `/c/${cistern.qrToken}`,
        },
        delivery,
        journey: {
          checkpoints,
          volumeDrops,
          qualityChanges,
          sampleCount: checkpoints.length,
        },
      },
    });
  }

  /** Lista stickers DEMO (hasta 50) para prueba de escaneo. */
  async listStickers(limit = 50) {
    const rows = await this.prisma.cistern.findMany({
      orderBy: { code: 'asc' },
      take: Math.min(100, Math.max(1, limit)),
      select: {
        code: true,
        qrToken: true,
        deviceId: true,
        plate: true,
        status: true,
        currentLoadLiters: true,
        currentBatch: { select: { batchCode: true, product: true } },
      },
    });
    return serialize({
      label: 'DEMO',
      note: 'Stickers QR permanentes de cisterna para prueba. Cada uno apunta a /c/{qrToken}.',
      data: rows.map((r) => ({
        ...r,
        deepLinkPath: `/c/${r.qrToken}`,
        qrUrl: `/c/${r.qrToken}`,
      })),
    });
  }

  /**
   * Estación escanea sticker → sube buffer del logger (o trail embebido) al servidor.
   * Idempotente por clientEventId.
   */
  async scanAndIngest(
    tokenOrCode: string,
    actor: AuthUser,
    body: {
      samples?: JourneySampleInput[];
      note?: string;
    } = {},
  ) {
    if (
      actor.role !== ActorRole.STATION_STAFF &&
      actor.role !== ActorRole.ADMIN &&
      actor.role !== ActorRole.TRANSPORTER
    ) {
      throw new BadRequestException(
        'Solo estación / chofer / admin pueden sincronizar el camino de la cisterna',
      );
    }

    const cistern = await this.resolveCistern(tokenOrCode);
    const delivery = await this.activeDelivery(cistern.id);
    if (!delivery && !cistern.currentBatchId) {
      throw new BadRequestException(
        'Esta cisterna no tiene viaje activo para subir datos',
      );
    }

    const batchId = delivery?.batchId ?? cistern.currentBatchId!;
    let samples = parseJourneyTrail(body.samples ?? []);

    // DEMO: si el dispositivo no mandó buffer, regeneramos un trail típico desde el despacho
    if (samples.length === 0 && delivery) {
      samples = this.demoTrailFromDelivery(cistern, delivery);
    }

    let inserted = 0;
    for (const sample of samples) {
      const clientEventId =
        sample.clientEventId ??
        `${cistern.deviceId}-${Math.floor(
          new Date(sample.capturedAt ?? Date.now()).getTime() / 1000,
        )}-${sample.kind ?? 'wp'}`;
      try {
        await this.prisma.routeCheckpoint.create({
          data: {
            kind: normalizeCheckpointKind(
              typeof sample.kind === 'string' ? sample.kind : undefined,
            ),
            label: sample.label,
            deliveryId: delivery?.id,
            cisternId: cistern.id,
            batchId,
            actorId: actor.id,
            volumeLiters: new Prisma.Decimal(sample.volumeLiters),
            density: decimalOrUndef(sample.density),
            temperature: decimalOrUndef(sample.temperature),
            waterDetected: Boolean(sample.waterDetected),
            latitude: sample.latitude,
            longitude: sample.longitude,
            accuracyMeters: sample.accuracyMeters,
            capturedAt: sample.capturedAt
              ? new Date(sample.capturedAt)
              : new Date(),
            clientEventId,
            note:
              sample.note ??
              body.note ??
              `Sync desde dispositivo ${cistern.deviceId}`,
            isDemo: true,
          },
        });
        inserted += 1;
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          continue; // ya estaba
        }
        throw e;
      }
    }

    const last = samples[samples.length - 1];
    if (last) {
      await this.prisma.cistern.update({
        where: { id: cistern.id },
        data: {
          currentLoadLiters: new Prisma.Decimal(last.volumeLiters),
          status: 'IN_TRANSIT',
          currentBatchId: batchId,
        },
      });
    }

    const checkpoints = await this.journeyFor(cistern.id, delivery?.id, batchId);
    const volumeDrops = computeVolumeDrops(checkpoints);
    const qualityChanges = computeQualityChanges(checkpoints);

    return serialize({
      label: 'DEMO',
      note: `Camino subido desde QR de cisterna / dispositivo ${cistern.deviceId}.`,
      data: {
        cistern: {
          code: cistern.code,
          qrToken: cistern.qrToken,
          deviceId: cistern.deviceId,
        },
        delivery: delivery
          ? {
              id: delivery.id,
              status: delivery.status,
              batchCode: delivery.batch.batchCode,
              stationCode: delivery.station.code,
              loadedLiters: delivery.loadedLiters,
            }
          : null,
        ingest: { inserted, totalSamples: samples.length },
        journey: {
          checkpoints,
          volumeDrops,
          qualityChanges,
          sampleCount: checkpoints.length,
        },
      },
    });
  }

  /** Tras subir el camino, la estación confirma recepción al stock. */
  async receiveAfterScan(
    tokenOrCode: string,
    actor: AuthUser,
    input: {
      receivedVolumeLiters?: number;
      receivedDensity?: number;
      receivedTemperature?: number;
      receivedWaterDetected?: boolean;
    } = {},
  ) {
    if (
      actor.role !== ActorRole.STATION_STAFF &&
      actor.role !== ActorRole.ADMIN
    ) {
      throw new BadRequestException('Solo la estación puede confirmar recepción');
    }

    // Primero asegura que el historial esté en servidor
    await this.scanAndIngest(tokenOrCode, actor);

    const cistern = await this.resolveCistern(tokenOrCode);
    const delivery = await this.activeDelivery(cistern.id);
    if (!delivery) {
      throw new BadRequestException('No hay despacho activo para recibir');
    }

    if (
      actor.role === ActorRole.STATION_STAFF &&
      actor.stationId &&
      delivery.destinationStationId !== actor.stationId
    ) {
      throw new BadRequestException(
        'Este viaje no está destinado a tu estación',
      );
    }

    const checkpoints = await this.journeyFor(
      cistern.id,
      delivery.id,
      delivery.batchId,
    );
    const lastCp = checkpoints[checkpoints.length - 1];
    const received =
      input.receivedVolumeLiters ??
      (lastCp
        ? Number(lastCp.volumeLiters.toString())
        : Number(delivery.loadedLiters.toString()));

    const qualityDensity =
      input.receivedDensity ??
      (lastCp?.density != null
        ? Number(lastCp.density.toString())
        : delivery.loadDensity
          ? Number(delivery.loadDensity.toString())
          : 0.745);
    const qualityTemp =
      input.receivedTemperature ??
      (lastCp?.temperature != null
        ? Number(lastCp.temperature.toString())
        : delivery.loadTemperature
          ? Number(delivery.loadTemperature.toString())
          : 22);
    const qualityWater =
      input.receivedWaterDetected ?? lastCp?.waterDetected ?? false;

    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'DELIVERED',
          receivedLiters: new Prisma.Decimal(received),
          receivedDensity: new Prisma.Decimal(qualityDensity),
          receivedTemperature: new Prisma.Decimal(qualityTemp),
          receivedWaterDetected: qualityWater,
          deliveredAt: now,
        },
      });

      await tx.driverSettlement.upsert({
        where: { deliveryId: delivery.id },
        create: settlementCreateData({
          deliveryId: delivery.id,
          driverId: cistern.driverId,
          cisternId: cistern.id,
          stationId: delivery.destinationStationId,
          batchId: delivery.batchId,
          liters: received,
        }),
        update: {},
      });

      const unload = Math.min(
        received,
        Number(cistern.currentLoadLiters.toString()),
      );
      let nextLoadStock = new Prisma.Decimal(cistern.currentLoadLiters.toString());
      if (unload > 0) {
        const nextLoad = applyStockWithdraw({
          previousStock: cistern.currentLoadLiters,
          withdrawLiters: unload,
          capacityLiters: cistern.capacityLiters,
        });
        nextLoadStock = nextLoad.nextStock;
      }
      await tx.cistern.update({
        where: { id: cistern.id },
        data: {
          currentLoadLiters: nextLoadStock,
          status: Number(nextLoadStock.toString()) < 1 ? 'AVAILABLE' : 'LOADED',
          currentBatchId:
            Number(nextLoadStock.toString()) < 1
              ? null
              : cistern.currentBatchId,
        },
      });

      const tank = await tx.storageTank.findFirst({
        where: { stationId: delivery.destinationStationId },
        orderBy: { createdAt: 'asc' },
      });
      if (tank) {
        const stock = applyStockDelta({
          previousStock: tank.currentStockLiters,
          receivedLiters: received,
          capacityLiters: tank.capacityLiters,
        });
        await tx.storageTank.update({
          where: { id: tank.id },
          data: { currentStockLiters: stock.nextStock },
        });
        await tx.station.update({
          where: { id: delivery.destinationStationId },
          data: {
            availability: stock.availability,
            lastInventoryAt: now,
          },
        });
        await tx.measurement.create({
          data: {
            batchId: delivery.batchId,
            tankId: tank.id,
            deviceId: cistern.deviceId,
            volumeLiters: stock.nextStock,
            temperature: new Prisma.Decimal(qualityTemp),
            density: new Prisma.Decimal(qualityDensity),
            waterDetected: qualityWater,
            latitude: delivery.station.latitude,
            longitude: delivery.station.longitude,
            source: 'MANUAL',
            isDemo: true,
          },
        });
      }

      await tx.routeCheckpoint.create({
        data: {
          kind: 'ARRIVAL_STATION',
          label: `Llegada ${delivery.station.code}`,
          deliveryId: delivery.id,
          cisternId: cistern.id,
          batchId: delivery.batchId,
          actorId: actor.id,
          volumeLiters: new Prisma.Decimal(received),
          density: new Prisma.Decimal(qualityDensity),
          temperature: new Prisma.Decimal(qualityTemp),
          waterDetected: qualityWater,
          latitude: Number(delivery.station.latitude.toString()),
          longitude: Number(delivery.station.longitude.toString()),
          clientEventId: `${cistern.deviceId}-arrival-${delivery.id}`,
          note: `Recepción por QR sticker ${cistern.qrToken}`,
          isDemo: true,
        },
      });

      await tx.custodyEvent.create({
        data: {
          batchId: delivery.batchId,
          eventType: 'RECEIVED',
          actorId: actor.id,
          location: `Estación ${delivery.station.code} (Cochabamba)`,
          declaredVolume: delivery.loadedLiters,
          measuredVolume: new Prisma.Decimal(received),
          metadata: {
            label: 'DEMO',
            cisternQrToken: cistern.qrToken,
            deviceId: cistern.deviceId,
            deliveryId: delivery.id,
            actorRole: actor.role,
          },
          isDemo: true,
        },
      });

      const freshBatch = await tx.fuelBatch.findUniqueOrThrow({
        where: { id: delivery.batchId },
      });
      const nextDelivered = new Prisma.Decimal(
        freshBatch.deliveredLiters?.toString?.() ?? 0,
      ).plus(received);
      await tx.fuelBatch.update({
        where: { id: freshBatch.id },
        data: {
          deliveredLiters: nextDelivered,
          currentLocation: `Estación ${delivery.station.code} (Cochabamba)`,
        },
      });

      return updatedDelivery;
    });

    const finalCheckpoints = await this.journeyFor(
      cistern.id,
      delivery.id,
      delivery.batchId,
    );

    return serialize({
      label: 'DEMO',
      note: 'Recepción confirmada. El historial del camino quedó almacenado con hora y GPS.',
      data: {
        delivery: result,
        cistern: {
          code: cistern.code,
          qrToken: cistern.qrToken,
          deviceId: cistern.deviceId,
        },
        journey: {
          checkpoints: finalCheckpoints,
          volumeDrops: computeVolumeDrops(finalCheckpoints),
          qualityChanges: computeQualityChanges(finalCheckpoints),
        },
      },
    });
  }

  private demoTrailFromDelivery(
    cistern: { code: string; deviceId: string },
    delivery: {
      id: string;
      loadedLiters: { toString(): string };
      loadDensity: { toString(): string } | null;
      loadTemperature: { toString(): string } | null;
      loadWaterDetected: boolean;
      loadedAt: Date;
      station: { latitude: { toString(): string }; longitude: { toString(): string } };
    },
  ): JourneySampleInput[] {
    const vol = Number(delivery.loadedLiters.toString());
    const dens = delivery.loadDensity
      ? Number(delivery.loadDensity.toString())
      : 0.745;
    const temp = delivery.loadTemperature
      ? Number(delivery.loadTemperature.toString())
      : 22;
    const t0 = delivery.loadedAt.getTime();
    const depotLat = -17.7833;
    const depotLng = -63.1821;
    const stLat = Number(delivery.station.latitude.toString());
    const stLng = Number(delivery.station.longitude.toString());
    const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

    return [
      {
        clientEventId: `${cistern.deviceId}-${delivery.id}-load`,
        kind: 'LOAD_DEPARTURE',
        label: `Carga ${cistern.code}`,
        volumeLiters: vol,
        density: dens,
        temperature: temp,
        waterDetected: delivery.loadWaterDetected,
        latitude: depotLat,
        longitude: depotLng,
        capturedAt: new Date(t0).toISOString(),
        note: 'Salida depósito — logger cisterna',
      },
      {
        clientEventId: `${cistern.deviceId}-${delivery.id}-wp1`,
        kind: 'ROUTE_WAYPOINT',
        label: 'Control ruta',
        volumeLiters: Number((vol - 1).toFixed(3)),
        density: dens,
        temperature: temp + 0.4,
        waterDetected: false,
        latitude: lerp(depotLat, stLat, 0.4),
        longitude: lerp(depotLng, stLng, 0.4),
        capturedAt: new Date(t0 + 2 * 3600_000).toISOString(),
        note: 'Muestra en ruta (dispositivo)',
      },
      {
        clientEventId: `${cistern.deviceId}-${delivery.id}-wp2`,
        kind: 'ROUTE_WAYPOINT',
        label: 'Aproximación estación',
        volumeLiters: Number((vol - 3).toFixed(3)),
        density: Number((dens - 0.002).toFixed(4)),
        temperature: temp + 1.2,
        waterDetected: false,
        latitude: lerp(depotLat, stLat, 0.8),
        longitude: lerp(depotLng, stLng, 0.8),
        capturedAt: new Date(t0 + 5 * 3600_000).toISOString(),
        note: 'Bajó ~2 L y cambió densidad/temp (DEMO)',
      },
    ];
  }
}
