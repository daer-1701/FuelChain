import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { generateBatchCode } from '../common/batch-code';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBatchDto,
  ListBatchesQueryDto,
  UpdateBatchDto,
} from './dto/batch.dto';

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBatchDto) {
    const batchCode = dto.batchCode?.trim() || (await generateBatchCode(this.prisma));

    const existing = await this.prisma.fuelBatch.findUnique({
      where: { batchCode },
    });
    if (existing) {
      throw new ConflictException(`Batch code already exists: ${batchCode}`);
    }

    const batch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.fuelBatch.create({
        data: {
          batchCode,
          product: dto.product,
          declaredVolumeLiters: new Prisma.Decimal(dto.declaredVolumeLiters),
          originCountry: dto.originCountry,
          destination: dto.destination,
          supplier: dto.supplier,
          importer: dto.importer,
          status: dto.status ?? 'DRAFT',
          currentLocation: dto.currentLocation ?? dto.originCountry,
          isDemo: dto.isDemo ?? true,
        },
      });

      await tx.custodyEvent.create({
        data: {
          batchId: created.id,
          eventType: 'CREATED',
          location: dto.currentLocation ?? dto.originCountry,
          declaredVolume: new Prisma.Decimal(dto.declaredVolumeLiters),
          metadata: {
            label: 'DEMO',
            note: 'FuelBatch created — FUELCHAIN ABSTRACTION',
          },
          isDemo: dto.isDemo ?? true,
        },
      });

      return created;
    });

    return serialize(batch);
  }

  async findAll(query: ListBatchesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const where: Prisma.FuelBatchWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.risk) where.riskLevel = query.risk;
    if (query.product) {
      where.product = { contains: query.product, mode: 'insensitive' };
    }
    if (query.origin) {
      where.originCountry = { contains: query.origin, mode: 'insensitive' };
    }
    if (query.q) {
      where.batchCode = { contains: query.q.toUpperCase(), mode: 'insensitive' };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.fuelBatch.count({ where }),
      this.prisma.fuelBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          custodyEvents: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return serialize({
      data: items.map((b) => {
        const { custodyEvents, ...rest } = b;
        return {
          ...rest,
          lastEvent: custodyEvents[0] ?? null,
        };
      }),
      meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
    });
  }

  async findOne(idOrCode: string) {
    const batch = await this.findBatchOrThrow(idOrCode);
    return serialize(batch);
  }

  async getPassport(idOrCode: string) {
    const batch = await this.findBatchOrThrow(idOrCode);

    const full = await this.prisma.fuelBatch.findUniqueOrThrow({
      where: { id: batch.id },
      include: {
        authorizations: { orderBy: { createdAt: 'desc' } },
        transports: { orderBy: { createdAt: 'desc' }, include: { vehicle: true } },
        customsEvents: { orderBy: { timestamp: 'asc' } },
        custodyEvents: { orderBy: { timestamp: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        qualityCertificates: { orderBy: { issueDate: 'desc' } },
        samplingEvents: {
          orderBy: { timestamp: 'asc' },
          include: { labAnalyses: true },
        },
        labAnalyses: { orderBy: { analysisDate: 'desc' } },
        measurements: { orderBy: { timestamp: 'desc' }, take: 20 },
        anomalies: { orderBy: { createdAt: 'desc' } },
        auditCases: { orderBy: { createdAt: 'desc' } },
        blockchainAnchors: { orderBy: { timestamp: 'desc' } },
      },
    });

    return serialize({
      label: 'DEMO',
      abstraction: 'FUELCHAIN ABSTRACTION',
      identification: {
        batchId: full.id,
        batchCode: full.batchCode,
        product: full.product,
        declaredVolumeLiters: full.declaredVolumeLiters,
        originCountry: full.originCountry,
        destination: full.destination,
        supplier: full.supplier,
        importer: full.importer,
        status: full.status,
        riskScore: full.riskScore,
        riskLevel: full.riskLevel,
        qualityStatus: full.qualityStatus,
        currentLocation: full.currentLocation,
        createdAt: full.createdAt,
      },
      quality: {
        certificates: full.qualityCertificates,
        sampling: full.samplingEvents,
        labAnalyses: full.labAnalyses,
      },
      quantity: {
        declared: full.declaredVolumeLiters,
        note: 'Received/Stored/Distributed computed in PHASE 9 (Reconciliation)',
      },
      custody: full.custodyEvents,
      authorizations: full.authorizations,
      transports: full.transports,
      customs: full.customsEvents,
      documents: full.documents,
      iot: full.measurements,
      anomalies: full.anomalies,
      audits: full.auditCases,
      blockchain: full.blockchainAnchors,
    });
  }

  async update(idOrCode: string, dto: UpdateBatchDto) {
    const batch = await this.findBatchOrThrow(idOrCode);
    const updated = await this.prisma.fuelBatch.update({
      where: { id: batch.id },
      data: {
        ...(dto.product !== undefined && { product: dto.product }),
        ...(dto.declaredVolumeLiters !== undefined && {
          declaredVolumeLiters: new Prisma.Decimal(dto.declaredVolumeLiters),
        }),
        ...(dto.originCountry !== undefined && { originCountry: dto.originCountry }),
        ...(dto.destination !== undefined && { destination: dto.destination }),
        ...(dto.supplier !== undefined && { supplier: dto.supplier }),
        ...(dto.importer !== undefined && { importer: dto.importer }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.riskLevel !== undefined && { riskLevel: dto.riskLevel }),
        ...(dto.riskScore !== undefined && { riskScore: dto.riskScore }),
        ...(dto.qualityStatus !== undefined && { qualityStatus: dto.qualityStatus }),
        ...(dto.currentLocation !== undefined && {
          currentLocation: dto.currentLocation,
        }),
      },
    });
    return serialize(updated);
  }

  async remove(idOrCode: string) {
    const batch = await this.findBatchOrThrow(idOrCode);
    await this.prisma.fuelBatch.delete({ where: { id: batch.id } });
    return { deleted: true, id: batch.id, batchCode: batch.batchCode };
  }

  /** Resolve by cuid id or batchCode */
  async findBatchOrThrow(idOrCode: string) {
    const batch = await this.prisma.fuelBatch.findFirst({
      where: {
        OR: [{ id: idOrCode }, { batchCode: idOrCode }],
      },
    });
    if (!batch) {
      throw new NotFoundException(`FuelBatch not found: ${idOrCode}`);
    }
    return batch;
  }
}
