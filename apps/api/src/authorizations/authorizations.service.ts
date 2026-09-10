import { Injectable } from '@nestjs/common';
import { BatchesService } from '../batches/batches.service';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthorizationDto } from './dto/create-authorization.dto';

@Injectable()
export class AuthorizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batches: BatchesService,
  ) {}

  async list(batchIdOrCode: string) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const rows = await this.prisma.importAuthorization.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(rows);
  }

  async create(batchIdOrCode: string, dto: CreateAuthorizationDto) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const row = await this.prisma.importAuthorization.create({
      data: {
        batchId: batch.id,
        authorizationType: dto.authorizationType,
        referenceNumber: dto.referenceNumber,
        issuer: dto.issuer,
        status: dto.status ?? 'PENDING',
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        documentId: dto.documentId,
        isDemo: true,
      },
    });
    return serialize(row);
  }
}
