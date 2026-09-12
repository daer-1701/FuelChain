import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorRole, Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/auth.service';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';

@Injectable()
export class CheckpointsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCheckpointDto, actor: AuthUser) {
    if (dto.clientEventId) {
      const existing = await this.prisma.routeCheckpoint.findUnique({
        where: { clientEventId: dto.clientEventId },
      });
      if (existing) {
        return serialize({
          label: 'DEMO',
          note: 'Checkpoint ya sincronizado (idempotente).',
          data: existing,
          duplicate: true,
        });
      }
    }

    let delivery =
      dto.deliveryId != null
        ? await this.prisma.delivery.findUnique({
            where: { id: dto.deliveryId },
            include: { cistern: true, batch: true, station: true },
          })
        : null;

    if (!delivery && actor.cisternCode) {
      delivery = await this.prisma.delivery.findFirst({
        where: {
          cistern: { code: actor.cisternCode },
          status: { in: ['LOADED', 'IN_TRANSIT'] },
        },
        orderBy: { loadedAt: 'desc' },
        include: { cistern: true, batch: true, station: true },
      });
    }

    const cisternCode = dto.cisternCode ?? actor.cisternCode ?? delivery?.cistern.code;
    if (!cisternCode) {
      throw new ForbiddenException(
        'Sin cisterna asignada. No se puede registrar el tramo.',
      );
    }

    const cistern = await this.prisma.cistern.findUnique({
      where: { code: cisternCode },
    });
    if (!cistern) throw new NotFoundException('Cisterna no encontrada');

    if (
      actor.role === ActorRole.TRANSPORTER &&
      cistern.driverId &&
      cistern.driverId !== actor.id
    ) {
      throw new ForbiddenException('Esta cisterna no está asignada a tu sesión.');
    }

    let batchId = delivery?.batchId;
    if (!batchId && dto.batchCode) {
      const batch = await this.prisma.fuelBatch.findUnique({
        where: { batchCode: dto.batchCode },
      });
      if (!batch) throw new NotFoundException('Lote no encontrado');
      batchId = batch.id;
    }
    if (!batchId && cistern.currentBatchId) {
      batchId = cistern.currentBatchId;
    }
    if (!batchId) {
      throw new NotFoundException(
        'No hay lote/despacho activo para este tramo. Emití QR o simulá primero.',
      );
    }

    try {
      const row = await this.prisma.routeCheckpoint.create({
        data: {
          kind: dto.kind,
          label: dto.label,
          deliveryId: delivery?.id,
          cisternId: cistern.id,
          batchId,
          actorId: actor.id,
          volumeLiters: new Prisma.Decimal(dto.volumeLiters),
          density:
            dto.density != null ? new Prisma.Decimal(dto.density) : undefined,
          temperature:
            dto.temperature != null
              ? new Prisma.Decimal(dto.temperature)
              : undefined,
          waterDetected: dto.waterDetected ?? false,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracyMeters: dto.accuracyMeters,
          clientEventId: dto.clientEventId,
          note: dto.note,
          isDemo: true,
        },
        include: {
          batch: { select: { batchCode: true, product: true } },
          cistern: { select: { code: true, plate: true } },
          delivery: {
            select: {
              id: true,
              status: true,
              station: { select: { code: true, name: true } },
            },
          },
        },
      });

      await this.prisma.cistern.update({
        where: { id: cistern.id },
        data: {
          currentLoadLiters: new Prisma.Decimal(dto.volumeLiters),
          status:
            dto.kind === 'ARRIVAL_STATION'
              ? 'IN_TRANSIT'
              : dto.kind === 'LOAD_DEPARTURE'
                ? 'LOADED'
                : 'IN_TRANSIT',
          currentBatchId: batchId,
        },
      });

      return serialize({
        label: 'DEMO',
        note:
          'Tramo registrado con ubicación del celular. No es telemetría industrial oficial.',
        data: row,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('clientEventId duplicado');
      }
      throw e;
    }
  }

  async listForActor(user: AuthUser) {
    const where: Prisma.RouteCheckpointWhereInput =
      user.role === ActorRole.STATION_STAFF && user.stationId
        ? { delivery: { destinationStationId: user.stationId } }
        : user.role === ActorRole.VERIFIER ||
            user.role === ActorRole.AUDITOR ||
            user.role === ActorRole.ADMIN
          ? {}
          : user.cisternCode
            ? { cistern: { code: user.cisternCode } }
            : { actorId: user.id };

    const rows = await this.prisma.routeCheckpoint.findMany({
      where,
      orderBy: { capturedAt: 'desc' },
        take: 200,
      include: {
        batch: { select: { batchCode: true, product: true } },
        cistern: { select: { code: true, plate: true } },
        delivery: {
          select: {
            id: true,
            status: true,
            station: { select: { code: true, name: true } },
          },
        },
        actor: { select: { name: true, role: true } },
      },
    });

    return serialize({
      label: 'DEMO',
      note:
        'Checkpoints de ruta: cantidad, calidad proxy y GPS al escanear/registrar el tramo.',
      data: rows,
    });
  }
}
