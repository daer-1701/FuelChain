import { Injectable } from '@nestjs/common';
import { BatchesService } from '../batches/batches.service';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batches: BatchesService,
  ) {}

  async list(batchIdOrCode: string) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const rows = await this.prisma.document.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(rows);
  }

  async create(batchIdOrCode: string, dto: CreateDocumentDto) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const row = await this.prisma.document.create({
      data: {
        batchId: batch.id,
        name: dto.name,
        type: dto.type,
        storageUrl: dto.storageUrl,
        sha256Hash: dto.sha256Hash.toLowerCase(),
        uploadedById: dto.uploadedById,
        blockchainTxHash: dto.blockchainTxHash,
        isDemo: true,
      },
    });
    return serialize(row);
  }

  /** Compare provided hash vs stored (full verify flow lands in PHASE 13). */
  async verify(batchIdOrCode: string, documentId: string, providedHash: string) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const doc = await this.prisma.document.findFirstOrThrow({
      where: { id: documentId, batchId: batch.id },
    });
    const matches = doc.sha256Hash.toLowerCase() === providedHash.toLowerCase();
    return {
      label: 'DEMO',
      documentId: doc.id,
      status: matches ? 'DOCUMENT VERIFIED' : 'DOCUMENT MODIFIED / HASH MISMATCH',
      detail: matches
        ? 'Hash matches stored record (blockchain anchor check in PHASE 12–13)'
        : 'Provided hash does not match stored sha256Hash',
      storedHash: doc.sha256Hash,
      providedHash: providedHash.toLowerCase(),
      blockchainTxHash: doc.blockchainTxHash,
    };
  }
}
