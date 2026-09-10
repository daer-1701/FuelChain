import { Injectable, NotFoundException } from '@nestjs/common';
import { serialize } from '../common/serialize';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddAuditNoteDto,
  CreateAuditCaseDto,
  UpdateAuditStatusDto,
} from './dto/audit.dto';

@Injectable()
export class AuditsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.auditCase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        batch: { select: { batchCode: true, product: true, riskScore: true } },
        anomaly: true,
        assignee: { select: { id: true, name: true, role: true } },
      },
    });
    return serialize({ label: 'DEMO', data: rows });
  }

  async findOne(id: string) {
    const row = await this.prisma.auditCase.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            documents: true,
            custodyEvents: { orderBy: { timestamp: 'asc' } },
            blockchainAnchors: { orderBy: { timestamp: 'desc' } },
          },
        },
        anomaly: true,
        notes: { orderBy: { createdAt: 'asc' }, include: { author: true } },
        assignee: true,
      },
    });
    if (!row) throw new NotFoundException(`Audit case not found: ${id}`);
    return serialize({
      label: 'DEMO',
      case: row,
      disclaimer:
        'Human decision only. System does not assign guilt automatically.',
    });
  }

  async create(dto: CreateAuditCaseDto) {
    const batch = await this.prisma.fuelBatch.findUniqueOrThrow({
      where: { id: dto.batchId },
    });
    const row = await this.prisma.auditCase.create({
      data: {
        batchId: dto.batchId,
        anomalyId: dto.anomalyId,
        title: dto.title,
        riskScore: batch.riskScore,
        assigneeId: dto.assigneeId,
        aiExplanation: dto.aiExplanation,
        status: 'OPEN',
        isDemo: true,
      },
    });
    await this.prisma.fuelBatch.update({
      where: { id: dto.batchId },
      data: { status: 'AUDIT_REQUIRED' },
    });
    return serialize(row);
  }

  async addNote(id: string, dto: AddAuditNoteDto) {
    await this.prisma.auditCase.findUniqueOrThrow({ where: { id } });
    const note = await this.prisma.auditNote.create({
      data: {
        auditCaseId: id,
        body: dto.body,
        authorId: dto.authorId,
        isDemo: true,
      },
    });
    return serialize(note);
  }

  async updateStatus(id: string, dto: UpdateAuditStatusDto) {
    const row = await this.prisma.auditCase.update({
      where: { id },
      data: { status: dto.status },
    });
    if (dto.status === 'UNDER_REVIEW' && row.anomalyId) {
      await this.prisma.anomaly.update({
        where: { id: row.anomalyId },
        data: { status: 'UNDER_REVIEW' },
      });
    }
    if (
      (dto.status === 'RESOLVED' || dto.status === 'FALSE_POSITIVE') &&
      row.anomalyId
    ) {
      await this.prisma.anomaly.update({
        where: { id: row.anomalyId },
        data: {
          status: dto.status === 'FALSE_POSITIVE' ? 'FALSE_POSITIVE' : 'RESOLVED',
        },
      });
    }
    return serialize(row);
  }
}
