import { createHmac, createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';

type IssueBatonInput = {
  batchCode: string;
  eventType: string;
  volumeLiters: number;
  cisternCode?: string;
  stationCode?: string;
  issuedByRole: string;
  previousHash?: string;
};

type AcceptBatonInput = {
  tokenId?: string;
  /** Self-contained offline payload from QR */
  embedded?: Record<string, unknown>;
  consumedByRole: string;
  stationCode?: string;
  receivedVolumeLiters?: number;
};

type OfflineSyncItem = {
  clientEventId: string;
  batonTokenId?: string;
  batchCode?: string;
  stationCode?: string;
  actorRole: string;
  eventType: string;
  payload: Record<string, unknown>;
  capturedAt: string;
};

@Injectable()
export class CustodyQrService {
  constructor(private readonly prisma: PrismaService) {}

  private secret() {
    return (
      process.env.BATON_HMAC_SECRET ||
      process.env.BLOCKCHAIN_PRIVATE_KEY ||
      'fuelchain-demo-baton-secret'
    );
  }

  private sign(payloadHash: string): string {
    return createHmac('sha256', this.secret()).update(payloadHash).digest('hex');
  }

  private hashPayload(obj: unknown): string {
    const canonical = JSON.stringify(obj);
    return createHash('sha256').update(canonical).digest('hex');
  }

  async issue(input: IssueBatonInput) {
    const batch = await this.prisma.fuelBatch.findFirst({
      where: {
        OR: [{ batchCode: input.batchCode }, { id: input.batchCode }],
      },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    let stationId: string | undefined;
    if (input.stationCode) {
      const st = await this.prisma.station.findUnique({
        where: { code: input.stationCode },
      });
      if (!st) throw new NotFoundException('Station not found');
      stationId = st.id;
    }

    const tokenId = `BT-${randomBytes(4).toString('hex').toUpperCase()}`;
    const issuedAt = new Date();
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
      role: input.issuedByRole,
      ph: input.previousHash ?? null,
      city: 'Cochabamba',
      label: 'DEMO',
    };
    const payloadHash = this.hashPayload(core);
    const signature = this.sign(payloadHash);
    const payloadJson = { ...core, h: payloadHash, s: signature };

    const row = await this.prisma.custodyBaton.create({
      data: {
        tokenId,
        batchId: batch.id,
        stationId,
        cisternCode: input.cisternCode,
        eventType: input.eventType,
        volumeLiters: new Prisma.Decimal(input.volumeLiters),
        payloadJson,
        payloadHash,
        previousHash: input.previousHash,
        signature,
        issuedByRole: input.issuedByRole,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        isDemo: true,
      },
    });

    const deepLinkPath = `/q/${tokenId}`;
    return serialize({
      label: 'DEMO',
      note: 'Bastón QR para custodia offline. El celular guarda el payload si no hay señal.',
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
    return serialize({
      label: 'DEMO',
      data: row,
      deepLinkPath: `/q/${tokenId}`,
    });
  }

  async accept(input: AcceptBatonInput) {
    let tokenId = input.tokenId;
    let embedded = input.embedded;

    if (!tokenId && embedded && typeof embedded.id === 'string') {
      tokenId = embedded.id;
    }
    if (!tokenId) throw new BadRequestException('tokenId or embedded.id required');

    let baton = await this.prisma.custodyBaton.findUnique({
      where: { tokenId },
      include: { batch: true },
    });

    // Offline-first: if server never saw the baton, recreate from embedded payload
    if (!baton && embedded) {
      const h = String(embedded.h ?? '');
      const s = String(embedded.s ?? '');
      const core = { ...embedded };
      delete (core as { h?: unknown }).h;
      delete (core as { s?: unknown }).s;
      const expected = this.hashPayload(core);
      if (h !== expected || s !== this.sign(h)) {
        throw new BadRequestException('Embedded baton signature invalid');
      }
      const batchCode = String(embedded.batch);
      const batch = await this.prisma.fuelBatch.findFirst({
        where: { batchCode },
      });
      if (!batch) throw new NotFoundException('Batch from baton not found');
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
          issuedByRole: String(embedded.role ?? 'TRANSPORTER'),
          isDemo: true,
        },
        include: { batch: true },
      });
    }

    if (!baton) throw new NotFoundException('Baton not found');
    if (baton.status !== 'ACTIVE') {
      throw new BadRequestException(`Baton status is ${baton.status}`);
    }

    let stationId = baton.stationId;
    if (input.stationCode) {
      const st = await this.prisma.station.findUnique({
        where: { code: input.stationCode },
      });
      if (!st) throw new NotFoundException('Station not found');
      stationId = st.id;
    }

    const received =
      input.receivedVolumeLiters ?? Number(baton.volumeLiters.toString());

    const updated = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.custodyBaton.update({
        where: { id: baton!.id },
        data: {
          status: 'CONSUMED',
          consumedAt: new Date(),
          consumedByRole: input.consumedByRole,
          stationId: stationId ?? undefined,
        },
      });

      await tx.custodyEvent.create({
        data: {
          batchId: baton!.batchId,
          eventType: 'RECEIVED',
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
          },
          isDemo: true,
        },
      });

      if (stationId) {
        const tank = await tx.storageTank.findFirst({
          where: { stationId },
          orderBy: { createdAt: 'asc' },
        });
        if (tank) {
          const fillRatio = received / Number(tank.capacityLiters.toString());
          const availability =
            fillRatio >= 0.7
              ? 'FULL'
              : fillRatio >= 0.35
                ? 'MEDIUM'
                : fillRatio > 0.05
                  ? 'LOW'
                  : 'EMPTY';
          await tx.station.update({
            where: { id: stationId },
            data: {
              availability,
              lastInventoryAt: new Date(),
            },
          });
          await tx.measurement.create({
            data: {
              batchId: baton!.batchId,
              tankId: tank.id,
              deviceId: 'QR-HANDOFF-DEMO',
              volumeLiters: new Prisma.Decimal(received),
              temperature: new Prisma.Decimal(22),
              waterDetected: false,
              source: 'MANUAL',
              isDemo: true,
            },
          });
        }
      }

      return consumed;
    });

    return serialize({
      label: 'DEMO',
      note: 'Bastón consumido. Custodia RECEIVED registrada (apto para sync tras offline).',
      data: updated,
    });
  }

  async syncOffline(events: OfflineSyncItem[]) {
    const results: Array<{ clientEventId: string; status: string; reason?: string }> =
      [];

    for (const ev of events) {
      const existing = await this.prisma.offlineSyncEvent.findUnique({
        where: { clientEventId: ev.clientEventId },
      });
      if (existing) {
        results.push({ clientEventId: ev.clientEventId, status: existing.status });
        continue;
      }

      const payloadHash = this.hashPayload(ev.payload);
      try {
        if (ev.eventType === 'ACCEPT_BATON' && ev.batonTokenId) {
          await this.accept({
            tokenId: ev.batonTokenId,
            embedded: ev.payload,
            consumedByRole: ev.actorRole,
            stationCode: ev.stationCode,
            receivedVolumeLiters:
              typeof ev.payload.vol === 'number' ? ev.payload.vol : undefined,
          });
        }

        await this.prisma.offlineSyncEvent.create({
          data: {
            clientEventId: ev.clientEventId,
            batonTokenId: ev.batonTokenId,
            batchId: null,
            stationId: null,
            actorRole: ev.actorRole,
            eventType: ev.eventType,
            payload: ev.payload as Prisma.InputJsonValue,
            payloadHash,
            capturedAt: new Date(ev.capturedAt),
            status: 'APPLIED',
            isDemo: true,
          },
        });
        results.push({ clientEventId: ev.clientEventId, status: 'APPLIED' });
      } catch (e) {
        const reason = e instanceof Error ? e.message : 'reject';
        await this.prisma.offlineSyncEvent.create({
          data: {
            clientEventId: ev.clientEventId,
            batonTokenId: ev.batonTokenId,
            actorRole: ev.actorRole,
            eventType: ev.eventType,
            payload: ev.payload as Prisma.InputJsonValue,
            payloadHash,
            capturedAt: new Date(ev.capturedAt),
            status: 'REJECTED',
            rejectReason: reason,
            isDemo: true,
          },
        });
        results.push({ clientEventId: ev.clientEventId, status: 'REJECTED', reason });
      }
    }

    return {
      label: 'DEMO',
      note: 'Sincronización store-and-forward desde celulares sin señal.',
      results,
    };
  }
}
