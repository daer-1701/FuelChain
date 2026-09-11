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

  /** Compare provided hash vs stored sha256; report linked on-chain tx if present. */
  async verify(batchIdOrCode: string, documentId: string, providedHash: string) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const doc = await this.prisma.document.findFirstOrThrow({
      where: { id: documentId, batchId: batch.id },
    });
    const matches = doc.sha256Hash.toLowerCase() === providedHash.toLowerCase();

    const linkedAnchor = doc.blockchainTxHash
      ? await this.prisma.blockchainAnchor.findFirst({
          where: { transactionHash: doc.blockchainTxHash },
        })
      : null;

    return {
      label: 'DEMO',
      documentId: doc.id,
      status: matches ? 'DOCUMENT VERIFIED' : 'DOCUMENT MODIFIED / HASH MISMATCH',
      detail: matches
        ? linkedAnchor
          ? 'Hash coincide con el registro y hay ancla blockchain indexada.'
          : 'Hash coincide con el registro almacenado (índice off-chain).'
        : 'El hash provisto no coincide con sha256Hash almacenado.',
      storedHash: doc.sha256Hash,
      providedHash: providedHash.toLowerCase(),
      blockchainTxHash: doc.blockchainTxHash,
      anchorIndexed: Boolean(linkedAnchor),
    };
  }
}
