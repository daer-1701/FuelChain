import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BatchesService } from '../batches/batches.service';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLabAnalysisDto,
  CreateQualityCertificateDto,
  CreateSamplingDto,
} from './dto/quality.dto';

@Injectable()
export class QualityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batches: BatchesService,
  ) {}

  async summary(batchIdOrCode: string) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const [certificates, sampling, labAnalyses] = await Promise.all([
      this.prisma.qualityCertificate.findMany({
        where: { batchId: batch.id },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.samplingEvent.findMany({
        where: { batchId: batch.id },
        orderBy: { timestamp: 'asc' },
        include: { labAnalyses: true },
      }),
      this.prisma.labAnalysis.findMany({
        where: { batchId: batch.id },
        orderBy: { analysisDate: 'desc' },
      }),
    ]);
    return serialize({
      label: 'DEMO',
      qualityStatus: batch.qualityStatus,
      certificates,
      sampling,
      labAnalyses,
    });
  }

  async addCertificate(batchIdOrCode: string, dto: CreateQualityCertificateDto) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const row = await this.prisma.qualityCertificate.create({
      data: {
        batchId: batch.id,
        certificateType: dto.certificateType,
        issuer: dto.issuer,
        certificateNumber: dto.certificateNumber,
        issueDate: new Date(dto.issueDate),
        status: dto.status ?? 'DEMO',
        documentId: dto.documentId,
        hash: dto.hash,
        isDemo: true,
      },
    });
    return serialize(row);
  }

  async addSampling(batchIdOrCode: string, dto: CreateSamplingDto) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const row = await this.prisma.samplingEvent.create({
      data: {
        batchId: batch.id,
        location: dto.location,
        sampleCode: dto.sampleCode,
        takenBy: dto.takenBy,
        metadata: (dto.metadata ?? { label: 'DEMO' }) as Prisma.InputJsonValue,
        isDemo: true,
      },
    });
    return serialize(row);
  }

  async addLabAnalysis(batchIdOrCode: string, dto: CreateLabAnalysisDto) {
    const batch = await this.batches.findBatchOrThrow(batchIdOrCode);
    const row = await this.prisma.labAnalysis.create({
      data: {
        batchId: batch.id,
        sampleId: dto.sampleId,
        laboratory: dto.laboratory,
        analysisDate: new Date(dto.analysisDate),
        parameters: dto.parameters as Prisma.InputJsonValue,
        result: dto.result,
        status: dto.status ?? 'DEMO',
        isDemo: true,
      },
    });
    return serialize(row);
  }
}
