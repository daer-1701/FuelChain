import { createHmac, createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ActorRole, BatchStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
import {
  assertCanTransition,
  canIssueQr,
  canReceiveBatch,
  canTransition,
} from '../common/batch-status';
import { canonicalJson } from '../common/canonical-json';
import {
  assertCisternCanLoad,
  nextCisternLoad,
  remainingBatchLiters,
} from '../common/delivery-accounting';
import { serialize } from '../common/serialize';
import { applyStockDelta, applyStockWithdraw } from '../common/tank-inventory';
import { ReceivedFollowUpService } from '../custody/received-follow-up.service';
import { PrismaService } from '../prisma/prisma.service';

const BATON_TTL_SEC = 72 * 60 * 60;

type IssueBatonInput = {
  batchCode: string;
  eventType: string;
  volumeLiters: number;
  cisternCode?: string;
  stationCode?: string;
  previousHash?: string;
};

type AcceptBatonInput = {
  tokenId?: string;
  embedded?: Record<string, unknown>;
  stationCode?: string;
  receivedVolumeLiters?: number;
  clientEventId?: string;
};

type OfflineSyncItem = {
  clientEventId: string;
  batonTokenId?: string;
  batchCode?: string;
  stationCode?: string;
  actorRole?: string;
  eventType: string;
  payload: Record<string, unknown>;
  capturedAt: string;
};

function isPrismaUnique(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: string }).code === 'P2002'
  );
}

@Injectable()
export class CustodyQrService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly followUp?: ReceivedFollowUpService,
  ) {}

  private secret() {
    const secret = process.env.CUSTODY_QR_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('CUSTODY_QR_SECRET is required');
    }
    return secret;
  }

  private sign(payloadHash: string): string {
    return createHmac('sha256', this.secret()).update(payloadHash).digest('hex');
  }

  private hashPayload(obj: unknown): string {
    return createHash('sha256').update(canonicalJson(obj)).digest('hex');
  }

  private coreFromEmbedded(embedded: Record<string, unknown>) {
    const core = { ...embedded };
    delete core.h;
    delete core.s;
    return core;
  }

  private assertEmbeddedSignature(embedded: Record<string, unknown>) {
    const h = String(embedded.h ?? '');
    const s = String(embedded.s ?? '');
    const expected = this.hashPayload(this.coreFromEmbedded(embedded));
    if (h !== expected || s !== this.sign(h)) {
      throw new BadRequestException('Embedded baton signature invalid');
    }
  }

  private expiresUnix(embedded: Record<string, unknown>): number | null {
    if (typeof embedded.exp === 'number') return embedded.exp;
    if (typeof embedded.ts === 'number') return embedded.ts + BATON_TTL_SEC;
    return null;
  }

  async issue(input: IssueBatonInput, actor: AuthUser) {
    const batch = await this.prisma.fuelBatch.findFirst({
      where: {
        OR: [{ batchCode: input.batchCode }, { id: input.batchCode }],
      },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    if (!canIssueQr(batch.status)) {
      throw new BadRequestException(
        `No se puede emitir QR desde estado ${batch.status}`,
      );
    }
    if (!(input.volumeLiters > 0)) {
      throw new BadRequestException(
        'volumeLiters debe ser el volumen de este movimiento, no se toma del lote',
      );
    }

    const transport = await this.prisma.transport.findFirst({
      where: { batchId: batch.id },
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true },
    });
    let vehicleId = transport?.vehicleId ?? undefined;
    if (!vehicleId && input.cisternCode) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          OR: [
            { identifier: input.cisternCode },
            { plate: input.cisternCode },
          ],
        },
      });
      vehicleId = vehicle?.id;
    }

    const loteLiters = Number(batch.declaredVolumeLiters?.toString?.() ?? NaN);
    const alreadyDelivered = Number(batch.deliveredLiters?.toString?.() ?? 0);
    const remaining = remainingBatchLiters({
      declaredLiters: loteLiters,
      deliveredLiters: alreadyDelivered,
    });
    const volumeLooksLikeLote =
      Number.isFinite(loteLiters) &&
      loteLiters > 0 &&
      Math.abs(input.volumeLiters - loteLiters) < 0.001 &&
      loteLiters > 40000;
    if (remaining > 0 && input.volumeLiters - remaining > 0.001) {
      throw new BadRequestException(
        `El lote solo tiene ${remaining} L pendientes de despacho`,
      );
    }

    let stationId: string | undefined;
    if (input.stationCode) {
      const st = await this.prisma.station.findUnique({
        where: { code: input.stationCode },
      });
      if (!st) throw new NotFoundException('Station not found');
      stationId = st.id;
    }

    const cistern = input.cisternCode
      ? await this.prisma.cistern.findUnique({
          where: { code: input.cisternCode },
        })
      : actor.cisternId
        ? await this.prisma.cistern.findUnique({
            where: { id: actor.cisternId },
          })
        : null;

    if (actor.role === ActorRole.TRANSPORTER && cistern) {
      if (cistern.driverId && cistern.driverId !== actor.id) {
        throw new BadRequestException(
          'Esta cisterna está asignada a otro chofer',
        );
      }
    }

    if (cistern) {
      assertCisternCanLoad({
        capacityLiters: cistern.capacityLiters,
        currentLoadLiters: cistern.currentLoadLiters,
        loadLiters: input.volumeLiters,
      });
    }

    const tokenId = `BT-${randomBytes(4).toString('hex').toUpperCase()}`;
    const issuedAt = new Date();
    const exp = Math.floor(issuedAt.getTime() / 1000) + BATON_TTL_SEC;
    const core = {
      v: 1,
      t: 'baton',
      id: tokenId,
      batch: batch.batchCode,
      cistern: input.cisternCode ?? null,
      station: input.stationCode ?? null,
      vol: input.volumeLiters,
      ev: input.eventType,
      ts: Math.floor(issuedAt.getTime() / 1000),
      exp,
      n: randomBytes(8).toString('hex'),
      iss: actor.id,
      role: actor.role,
      ph: input.previousHash ?? null,
      city: 'Cochabamba',
      label: 'DEMO',
    };
    const payloadHash = this.hashPayload(core);
    const signature = this.sign(payloadHash);
    const payloadJson = { ...core, h: payloadHash, s: signature };

    const row = await this.prisma.$transaction(async (tx) => {
      let deliveryId: string | undefined;
      if (cistern && stationId) {
        const cert = await tx.qualityCertificate.findFirst({
          where: { batchId: batch.id },
          orderBy: { issueDate: 'desc' },
        });
        const delivery = await tx.delivery.create({
          data: {
            batchId: batch.id,
            cisternId: cistern.id,
            destinationStationId: stationId,
            status: 'IN_TRANSIT',
            loadedLiters: new Prisma.Decimal(input.volumeLiters),
            loadDensity: new Prisma.Decimal(0.745),
            loadTemperature: new Prisma.Decimal(22),
            loadWaterDetected: false,
            loadCertificateStatus: cert?.status ?? batch.qualityStatus,
            isDemo: true,
          },
        });
        deliveryId = delivery.id;
        const nextLoad = nextCisternLoad({
          currentLoadLiters: cistern.currentLoadLiters,
          deltaLiters: input.volumeLiters,
        });
        await tx.cistern.update({
          where: { id: cistern.id },
          data: {
            currentLoadLiters: nextLoad,
            status: 'IN_TRANSIT',
            currentBatchId: batch.id,
            driverId: cistern.driverId ?? actor.id,
          },
        });
        const depot = await tx.storageTank.findFirst({
          where: { stationId: null, cisternCode: null, name: 'TANK-001' },
        });
        if (depot) {
          const depotStock = applyStockWithdraw({
            previousStock: depot.currentStockLiters,
            withdrawLiters: input.volumeLiters,
            capacityLiters: depot.capacityLiters,
          });
          await tx.storageTank.update({
            where: { id: depot.id },
            data: { currentStockLiters: depotStock.nextStock },
          });
        }
      }

      const created = await tx.custodyBaton.create({
        data: {
          tokenId,
          batchId: batch.id,
          vehicleId,
          stationId,
          cisternId: cistern?.id,
          deliveryId,
          cisternCode: cistern?.code ?? input.cisternCode,
          eventType: input.eventType,
          volumeLiters: new Prisma.Decimal(input.volumeLiters),
          payloadJson,
          payloadHash,
          previousHash: input.previousHash,
          signature,
          issuedByRole: actor.role,
          expiresAt: new Date(exp * 1000),
          isDemo: true,
        },
      });
      if (deliveryId) {
        await tx.delivery.update({
          where: { id: deliveryId },
          data: { batonTokenId: tokenId },
        });
      }

      if (batch.status === BatchStatus.AUTHORIZED) {
        assertCanTransition(batch.status, BatchStatus.IN_TRANSIT);
        await tx.fuelBatch.update({
          where: { id: batch.id },
          data: {
            status: BatchStatus.IN_TRANSIT,
            currentLocation: input.cisternCode
              ? `Cisterna ${input.cisternCode}`
              : batch.currentLocation,
          },
        });
      } else if (batch.status === BatchStatus.IN_TRANSIT && input.cisternCode) {
        await tx.fuelBatch.update({
          where: { id: batch.id },
          data: { currentLocation: `Cisterna ${input.cisternCode}` },
        });
      }

      return created;
    });

    const deepLinkPath = `/q/${tokenId}`;
    return serialize({
      label: 'DEMO',
      note: 'Bastón QR firmado (HMAC). El payload viaja en ?p= para uso offline. El volumen es del movimiento, no del lote.',
      volumeLooksLikeLote,
      transport: transport
        ? {
            id: transport.id,
            carrier: transport.carrier,
            vehicleRef: transport.vehicleRef,
            origin: transport.origin,
            destination: transport.destination,
            status: transport.status,
          }
        : null,
      data: {
        ...row,
        qrPayload: payloadJson,
        qrText: JSON.stringify(payloadJson),
        deepLinkPath,
      },
    });
  }

  async getBaton(tokenId: string) {
    const row = await this.prisma.custodyBaton.findUnique({
      where: { tokenId },
      include: {
        batch: { select: { batchCode: true, product: true } },
        station: { select: { code: true, name: true } },
      },
    });
    if (!row) throw new NotFoundException('Baton not found');

    const now = new Date();
    if (row.status === 'ACTIVE' && row.expiresAt && row.expiresAt <= now) {
      const expired = await this.prisma.custodyBaton.updateMany({
        where: { id: row.id, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });
      if (expired.count === 1) {
        row.status = 'EXPIRED';
      }
    }

    return serialize({
      label: 'DEMO',
      data: row,
      deepLinkPath: `/q/${tokenId}`,
    });
  }

  async accept(input: AcceptBatonInput, actor: AuthUser) {
    let tokenId = input.tokenId;
    const embedded = input.embedded;

    if (!tokenId && embedded && typeof embedded.id === 'string') {
      tokenId = embedded.id;
    }
    if (!tokenId) {
      throw new BadRequestException('tokenId or embedded.id required');
    }

    if (embedded) {
      this.assertEmbeddedSignature(embedded);
      const exp = this.expiresUnix(embedded);
      if (exp !== null && Math.floor(Date.now() / 1000) > exp) {
        throw new BadRequestException('Baton expired');
      }
    }

    let baton = await this.prisma.custodyBaton.findUnique({
      where: { tokenId },
      include: { batch: true, delivery: true, cistern: true },
    });

    if (!baton && embedded) {
      const h = String(embedded.h ?? '');
      const s = String(embedded.s ?? '');
      const batchCode = String(embedded.batch);
      const batch = await this.prisma.fuelBatch.findFirst({
        where: { batchCode },
      });
      if (!batch) throw new NotFoundException('Batch from baton not found');
      const exp = this.expiresUnix(embedded);
      const expiresAt = exp !== null ? new Date(exp * 1000) : null;
      try {
        baton = await this.prisma.custodyBaton.create({
          data: {
            tokenId,
            batchId: batch.id,
            cisternCode: embedded.cistern ? String(embedded.cistern) : null,
            eventType: String(embedded.ev ?? 'IN_TRANSIT'),
            volumeLiters: new Prisma.Decimal(Number(embedded.vol ?? 0)),
            payloadJson: embedded as Prisma.InputJsonValue,
            payloadHash: h,
            previousHash: embedded.ph ? String(embedded.ph) : null,
            signature: s,
            issuedByRole: String(embedded.role ?? 'UNKNOWN'),
            expiresAt,
            isDemo: true,
          },
          include: { batch: true, delivery: true, cistern: true },
        });
      } catch (e) {
        if (!isPrismaUnique(e)) throw e;
        baton = await this.prisma.custodyBaton.findUnique({
          where: { tokenId },
          include: { batch: true, delivery: true, cistern: true },
        });
      }
    }

    if (!baton) throw new NotFoundException('Baton not found');

    const now = new Date();
    if (baton.expiresAt && baton.expiresAt.getTime() <= now.getTime()) {
      await this.prisma.custodyBaton.updateMany({
        where: { id: baton.id, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Baton expired');
    }
    if (baton.status === 'EXPIRED') {
      throw new BadRequestException('Baton expired');
    }
    if (baton.status !== 'ACTIVE') {
      throw new ConflictException(`Baton status is ${baton.status}`);
    }

    let stationId = baton.stationId ?? baton.delivery?.destinationStationId ?? null;
    if (actor.role === ActorRole.STATION_STAFF && actor.stationId) {
      if (input.stationCode && actor.stationCode && input.stationCode !== actor.stationCode) {
        throw new BadRequestException(
          'Solo podés recibir cisternas en tu estación asignada',
        );
      }
      if (stationId && stationId !== actor.stationId) {
        throw new BadRequestException(
          'Este despacho no está destinado a tu estación',
        );
      }
      stationId = actor.stationId;
    } else if (input.stationCode) {
      const st = await this.prisma.station.findUnique({
        where: { code: input.stationCode },
      });
      if (!st) throw new NotFoundException('Station not found');
      stationId = st.id;
    }
    if (
      baton.delivery?.destinationStationId &&
      stationId &&
      baton.delivery.destinationStationId !== stationId
    ) {
      throw new BadRequestException(
        'El destino del despacho no coincide con la estación que recibe',
      );
    }

    const received =
      input.receivedVolumeLiters ?? Number(baton.volumeLiters.toString());

    const updated = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.custodyBaton.updateMany({
        where: {
          id: baton!.id,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: {
          status: 'CONSUMED',
          consumedAt: now,
          consumedByRole: actor.role,
          stationId: stationId ?? undefined,
        },
      });
      if (consumed.count !== 1) {
        throw new ConflictException('Baton already consumed or expired');
      }

      const event = await tx.custodyEvent.create({
        data: {
          batchId: baton!.batchId,
          eventType: 'RECEIVED',
          actorId: actor.id,
          location: input.stationCode
            ? `Estación ${input.stationCode} (Cochabamba)`
            : 'Recepción DEMO Cochabamba',
          declaredVolume: baton!.volumeLiters,
          measuredVolume: new Prisma.Decimal(received),
          metadata: {
            label: 'DEMO',
            batonTokenId: baton!.tokenId,
            cisternCode: baton!.cisternCode,
            offlineCapable: true,
            actorRole: actor.role,
          },
          isDemo: true,
        },
      });

      const freshBatch = await tx.fuelBatch.findUniqueOrThrow({
        where: { id: baton!.batchId },
      });
      if (!canReceiveBatch(freshBatch.status)) {
        throw new BadRequestException(
          `Recepción no permitida desde estado ${freshBatch.status}`,
        );
      }
      const nextDelivered = new Prisma.Decimal(
        freshBatch.deliveredLiters?.toString?.() ?? 0,
      ).plus(received);
      const declared = Number(
        freshBatch.declaredVolumeLiters?.toString?.() ?? 0,
      );
      const stillOpen = declared > 0 && Number(nextDelivered.toString()) + 0.001 < declared;
      const nextStatus = stillOpen
        ? BatchStatus.DISTRIBUTING
        : canTransition(freshBatch.status, BatchStatus.RECEIVED)
          ? BatchStatus.RECEIVED
          : freshBatch.status;
      await tx.fuelBatch.update({
        where: { id: freshBatch.id },
        data: {
          deliveredLiters: nextDelivered,
          status: nextStatus,
          currentLocation:
            input.stationCode || actor.stationCode
              ? `Estación ${input.stationCode ?? actor.stationCode} (Cochabamba)`
              : freshBatch.currentLocation,
        },
      });

      const delivery = baton!.deliveryId
        ? await tx.delivery.findUnique({ where: { id: baton!.deliveryId } })
        : null;
      const qualityTemp =
        delivery?.loadTemperature ?? new Prisma.Decimal(22);
      const qualityDensity = delivery?.loadDensity ?? new Prisma.Decimal(0.745);
      const qualityWater = delivery?.loadWaterDetected ?? false;

      if (delivery) {
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            status: 'DELIVERED',
            receivedLiters: new Prisma.Decimal(received),
            receivedDensity: qualityDensity,
            receivedTemperature: qualityTemp,
            receivedWaterDetected: qualityWater,
            deliveredAt: now,
          },
        });
      }

      const cisternId = baton!.cisternId ?? delivery?.cisternId;
      if (cisternId) {
        const cisternRow = await tx.cistern.findUnique({
          where: { id: cisternId },
        });
        if (cisternRow) {
          const unload = Math.min(
            received,
            Number(cisternRow.currentLoadLiters.toString()),
          );
          if (unload > 0) {
            const nextLoad = nextCisternLoad({
              currentLoadLiters: cisternRow.currentLoadLiters,
              deltaLiters: -unload,
            });
            await tx.cistern.update({
              where: { id: cisternRow.id },
              data: {
                currentLoadLiters: nextLoad,
                status: Number(nextLoad.toString()) < 1 ? 'AVAILABLE' : 'LOADED',
                currentBatchId:
                  Number(nextLoad.toString()) < 1 ? null : cisternRow.currentBatchId,
              },
            });
          }
        }
      }

      if (stationId) {
        const tank = await tx.storageTank.findFirst({
          where: { stationId },
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
            where: { id: stationId },
            data: {
              availability: stock.availability,
              lastInventoryAt: now,
            },
          });
          await tx.measurement.create({
            data: {
              batchId: baton!.batchId,
              tankId: tank.id,
              deviceId: 'QR-HANDOFF-DEMO',
              volumeLiters: stock.nextStock,
              temperature: qualityTemp,
              density: qualityDensity,
              waterDetected: qualityWater,
              source: 'MANUAL',
              isDemo: true,
            },
          });
        }
      }

      const consumedBaton = await tx.custodyBaton.findUniqueOrThrow({
        where: { id: baton!.id },
      });
      return { baton: consumedBaton, event };
    });

    let follow: Awaited<
      ReturnType<ReceivedFollowUpService['afterReceived']>
    > | null = null;
    if (this.followUp) {
      follow = await this.followUp.afterReceived(updated.event, {
        id: baton.batch.id,
        batchCode: baton.batch.batchCode,
      });
    }

    return serialize({
      label: 'DEMO',
      note: 'Bastón consumido. Custodia RECEIVED e inventario actualizados como delta. El ancla blockchain es best-effort.',
      data: updated.baton,
      movement: follow?.reconciliation ?? null,
      anomaly: follow?.anomaly ?? null,
      blockchain: follow?.blockchain ?? null,
    });
  }

  async syncOffline(events: OfflineSyncItem[], actor: AuthUser) {
    const results: Array<{
      clientEventId: string;
      status: string;
      reason?: string;
    }> = [];

    for (const ev of events) {
      const existing = await this.prisma.offlineSyncEvent.findUnique({
        where: { clientEventId: ev.clientEventId },
      });
      if (existing) {
        results.push({
          clientEventId: ev.clientEventId,
          status: existing.status,
        });
        continue;
      }

      const payloadHash = this.hashPayload(ev.payload);
      try {
        await this.prisma.offlineSyncEvent.create({
          data: {
            clientEventId: ev.clientEventId,
            batonTokenId: ev.batonTokenId,
            batchId: null,
            stationId: null,
            actorRole: actor.role,
            eventType: ev.eventType,
            payload: ev.payload as Prisma.InputJsonValue,
            payloadHash,
            capturedAt: new Date(ev.capturedAt),
            status: 'PENDING',
            isDemo: true,
          },
        });
      } catch (e) {
        if (isPrismaUnique(e)) {
          const again = await this.prisma.offlineSyncEvent.findUnique({
            where: { clientEventId: ev.clientEventId },
          });
          results.push({
            clientEventId: ev.clientEventId,
            status: again?.status ?? 'APPLIED',
          });
          continue;
        }
        throw e;
      }

      try {
        if (ev.eventType === 'ACCEPT_BATON' && ev.batonTokenId) {
          await this.accept(
            {
              tokenId: ev.batonTokenId,
              embedded: ev.payload,
              stationCode: ev.stationCode,
              receivedVolumeLiters:
                typeof ev.payload.vol === 'number' ? ev.payload.vol : undefined,
              clientEventId: ev.clientEventId,
            },
            actor,
          );
        }

        await this.prisma.offlineSyncEvent.update({
          where: { clientEventId: ev.clientEventId },
          data: { status: 'APPLIED' },
        });
        results.push({ clientEventId: ev.clientEventId, status: 'APPLIED' });
      } catch (e) {
        const reason = e instanceof Error ? e.message : 'reject';
        const alreadyConsumed =
          e instanceof ConflictException ||
          reason.includes('already consumed') ||
          reason.includes('CONSUMED');
        await this.prisma.offlineSyncEvent.update({
          where: { clientEventId: ev.clientEventId },
          data: {
            status: alreadyConsumed ? 'APPLIED' : 'REJECTED',
            rejectReason: alreadyConsumed ? undefined : reason,
          },
        });
        results.push({
          clientEventId: ev.clientEventId,
          status: alreadyConsumed ? 'APPLIED' : 'REJECTED',
          reason: alreadyConsumed ? undefined : reason,
        });
      }
    }

    return {
      label: 'DEMO',
      note: 'Sincronización store-and-forward. clientEventId es idempotente.',
      results,
    };
  }
}
