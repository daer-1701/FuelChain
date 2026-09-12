import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorRole, Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { settlementCreateData } from './settlement-math';

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureForDelivery(deliveryId: string) {
    const existing = await this.prisma.driverSettlement.findUnique({
      where: { deliveryId },
    });
    if (existing) return existing;

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { cistern: true },
    });
    if (!delivery || delivery.status !== 'DELIVERED') {
      throw new BadRequestException(
        'Solo se liquida una entrega ya recibida (DELIVERED)',
      );
    }
    const liters = Number(
      (delivery.receivedLiters ?? delivery.loadedLiters).toString(),
    );
    try {
      return await this.prisma.driverSettlement.create({
        data: settlementCreateData({
          deliveryId: delivery.id,
          driverId: delivery.cistern.driverId,
          cisternId: delivery.cisternId,
          stationId: delivery.destinationStationId,
          batchId: delivery.batchId,
          liters,
        }),
      });
    } catch (e) {
      if (
        typeof e === 'object' &&
        e &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        return this.prisma.driverSettlement.findUniqueOrThrow({
          where: { deliveryId },
        });
      }
      throw e;
    }
  }

  async listForActor(user: AuthUser) {
    let where: Prisma.DriverSettlementWhereInput = {};
    if (user.role === ActorRole.STATION_STAFF && user.stationId) {
      where = { stationId: user.stationId };
    } else if (user.role === ActorRole.TRANSPORTER) {
      where = {
        OR: [
          { driverId: user.id },
          ...(user.cisternCode
            ? [{ cistern: { code: user.cisternCode } }]
            : []),
        ],
      };
    } else if (user.role !== ActorRole.ADMIN && user.role !== ActorRole.VERIFIER) {
      throw new BadRequestException('Sin acceso a liquidaciones');
    }

    const rows = await this.prisma.driverSettlement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        batch: { select: { batchCode: true, product: true } },
        cistern: { select: { code: true, plate: true } },
        station: { select: { code: true, name: true } },
        driver: { select: { name: true, email: true } },
        delivery: { select: { batonTokenId: true, deliveredAt: true } },
      },
    });

    return serialize({
      label: 'DEMO',
      note:
        'Liquidación DEMO al chofer tras entrega completada. Tarifa fija DEMO; no es pago bancario.',
      data: rows.map((r) => ({
        id: r.id,
        status: r.status,
        liters: Number(r.liters.toString()),
        ratePerLiter: Number(r.ratePerLiter.toString()),
        amountBob: Number(r.amountBob.toString()),
        currency: r.currency,
        batchCode: r.batch.batchCode,
        product: r.batch.product,
        cisternCode: r.cistern.code,
        stationCode: r.station.code,
        stationName: r.station.name.replace(/\s*\(DEMO\)\s*/gi, ' ').trim(),
        driverName: r.driver?.name ?? 'Chofer',
        batonTokenId: r.delivery.batonTokenId,
        deliveredAt: r.delivery.deliveredAt,
        paidAt: r.paidAt,
        evidenceNote: r.evidenceNote,
        createdAt: r.createdAt,
      })),
    });
  }

  async markPaid(id: string, user: AuthUser) {
    if (
      user.role !== ActorRole.STATION_STAFF &&
      user.role !== ActorRole.ADMIN
    ) {
      throw new BadRequestException(
        'Solo la estación (o admin) marca la liquidación como pagada',
      );
    }
    const row = await this.prisma.driverSettlement.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Liquidación no encontrada');
    if (
      user.role === ActorRole.STATION_STAFF &&
      user.stationId &&
      row.stationId !== user.stationId
    ) {
      throw new BadRequestException('Solo podés pagar liquidaciones de tu EESS');
    }
    if (row.status === 'PAID') {
      return serialize({
        label: 'DEMO',
        note: 'Ya estaba marcada como pagada.',
        data: row,
      });
    }
    const updated = await this.prisma.driverSettlement.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidById: user.id,
        evidenceNote:
          row.evidenceNote ??
          'Liquidación DEMO marcada como pagada por la estación.',
      },
    });
    return serialize({
      label: 'DEMO',
      note: 'Liquidación marcada como pagada (DEMO — no mueve dinero real).',
      data: updated,
    });
  }
}
