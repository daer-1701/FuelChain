import { canonicalJson } from '../common/canonical-json';

export const CUSTODY_RECEIVED_SCHEMA = 'fuelchain.custody.received.v1';

export type CustodyReceivedEvidence = {
  schema: typeof CUSTODY_RECEIVED_SCHEMA;
  batchId: string;
  batchCode: string;
  custodyEventId: string;
  from: string | null;
  to: string | null;
  volumeLiters: string;
  expectedVolumeLiters: string | null;
  occurredAt: string;
  actorId: string | null;
  label: 'DEMO';
};

function liters(v: { toString(): string } | string | number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const n = Number(v.toString());
  if (!Number.isFinite(n)) return null;
  return n.toFixed(3);
}

export function buildCustodyReceivedEvidence(input: {
  batchId: string;
  batchCode: string;
  custodyEventId: string;
  from?: string | null;
  to?: string | null;
  volumeLiters: { toString(): string } | string | number;
  expectedVolumeLiters?: { toString(): string } | string | number | null;
  occurredAt: Date | string;
  actorId?: string | null;
}): CustodyReceivedEvidence {
  const occurred =
    input.occurredAt instanceof Date
      ? input.occurredAt.toISOString()
      : new Date(input.occurredAt).toISOString();
  return {
    schema: CUSTODY_RECEIVED_SCHEMA,
    actorId: input.actorId ?? null,
    batchCode: input.batchCode,
    batchId: input.batchId,
    custodyEventId: input.custodyEventId,
    expectedVolumeLiters: liters(input.expectedVolumeLiters ?? null),
    from: input.from ?? null,
    label: 'DEMO',
    occurredAt: occurred,
    to: input.to ?? null,
    volumeLiters: liters(input.volumeLiters) ?? '0.000',
  };
}

export function canonicalCustodyReceivedJson(
  evidence: CustodyReceivedEvidence,
): string {
  return canonicalJson(evidence);
}
