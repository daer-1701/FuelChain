import { Injectable, Logger } from '@nestjs/common';
import { AnomalySeverity, AnomalyType, Prisma } from '@prisma/client';
import { BlockchainService } from '../blockchain/blockchain.service';
import {
  reconcileMovement,
  type MovementReconciliation,
} from '../batches/movement-reconciliation';
import { PrismaService } from '../prisma/prisma.service';

type ReceivedEvent = {
  id: string;
  batchId: string;
  eventType: string;
  actorId: string | null;
  location: string | null;
  declaredVolume: Prisma.Decimal | string | number | null;
  measuredVolume: Prisma.Decimal | string | number | null;
  timestamp: Date;
  metadata: Prisma.JsonValue | null;
};

type ReceivedBatch = {
  id: string;
  batchCode: string;
};

export function movementAnomalyKey(custodyEventId: string): string {
  return `movement:${custodyEventId}`;
}

@Injectable()
export class ReceivedFollowUpService {
  private readonly logger = new Logger(ReceivedFollowUpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
  ) {}

  async afterReceived(event: ReceivedEvent, batch: ReceivedBatch) {
    const reconciliation = reconcileMovement({
      expectedLiters: event.declaredVolume,
      receivedLiters: event.measuredVolume,
      custodyEventId: event.id,
    });

    const anomaly =
      reconciliation.status === 'ANOMALY'
        ? await this.ensureVolumeAnomaly(batch.id, reconciliation)
        : null;

    const blockchain = await this.blockchain.anchorCustodyReceivedBestEffort(
      event,
      batch,
    );

    return { reconciliation, anomaly, blockchain };
  }

  private async ensureVolumeAnomaly(
    batchId: string,
    recon: MovementReconciliation,
  ) {
    const expected = movementAnomalyKey(recon.custodyEventId ?? 'unknown');
    const existing = await this.prisma.anomaly.findFirst({
      where: {
        batchId,
        type: AnomalyType.VOLUME_DISCREPANCY,
        expected,
      },
    });
    if (existing) return existing;

    const abs = recon.absDifferenceLiters ?? 0;
    const expectedL = recon.expectedLiters ?? 0;
    const ratio = expectedL > 0 ? abs / expectedL : 1;
    const severity =
      ratio >= 0.1 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM;

    return this.prisma.anomaly.create({
      data: {
        batchId,
        type: AnomalyType.VOLUME_DISCREPANCY,
        severity,
        expected,
        actual: recon.receivedLiters?.toString() ?? null,
        difference: recon.differenceLiters?.toString() ?? null,
        riskImpact: severity === AnomalySeverity.HIGH ? 25 : 10,
        status: 'OPEN',
        explanation:
          'Señal DEMO de discrepancia de volumen en un movimiento (esperado vs recibido). Requiere revisión humana. Discrepancia ≠ robo y no es un hallazgo de fraude.',
        isDemo: true,
      },
    });
  }
}
