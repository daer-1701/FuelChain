import { Prisma } from '@prisma/client';

type CustodyLike = {
  eventType: string;
  measuredVolume: Prisma.Decimal | string | number | null;
  declaredVolume: Prisma.Decimal | string | number | null;
};

type MeasurementLike = {
  volumeLiters: Prisma.Decimal | string | number;
  source: string;
  timestamp: Date | string;
};

function toNum(v: Prisma.Decimal | string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

function volumeFromCustody(
  events: CustodyLike[],
  types: string[],
): { liters: number | null; eventType: string | null } {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (!types.includes(e.eventType)) continue;
    const measured = toNum(e.measuredVolume);
    if (measured !== null) return { liters: measured, eventType: e.eventType };
    const declared = toNum(e.declaredVolume);
    if (declared !== null) return { liters: declared, eventType: e.eventType };
  }
  return { liters: null, eventType: null };
}

/**
 * Build DEMO reconciliation ladder from custody + latest measurement.
 * Does not assert physical truth — compares digital records.
 */
export function buildQuantityReconciliation(input: {
  declaredVolumeLiters: Prisma.Decimal | string | number;
  custodyEvents: CustodyLike[];
  measurements: MeasurementLike[];
}) {
  const declared = toNum(input.declaredVolumeLiters) ?? 0;
  const received = volumeFromCustody(input.custodyEvents, ['RECEIVED']);
  const stored = volumeFromCustody(input.custodyEvents, ['STORED']);
  const latest = input.measurements[0];
  const sensor = latest
    ? {
        liters: toNum(latest.volumeLiters),
        source: latest.source,
        at: latest.timestamp,
      }
    : { liters: null as number | null, source: null as string | null, at: null };

  const steps = [
    { key: 'declared', label: 'Declarado', liters: declared },
    { key: 'received', label: 'Recepción', liters: received.liters },
    { key: 'stored', label: 'Almacén', liters: stored.liters },
    {
      key: 'sensor',
      label: sensor.source === 'SIMULATOR' ? 'Simulador' : 'Medición',
      liters: sensor.liters,
    },
  ];

  const present = steps.filter((s) => s.liters !== null) as Array<{
    key: string;
    label: string;
    liters: number;
  }>;

  const deltas: Array<{
    from: string;
    to: string;
    differenceLiters: number;
  }> = [];
  for (let i = 1; i < present.length; i++) {
    deltas.push({
      from: present[i - 1].key,
      to: present[i].key,
      differenceLiters: present[i].liters - present[i - 1].liters,
    });
  }

  const totalGap =
    sensor.liters !== null ? sensor.liters - declared : received.liters !== null ? received.liters - declared : 0;

  return {
    declared,
    received: received.liters,
    stored: stored.liters,
    sensor: sensor.liters,
    sensorSource: sensor.source,
    sensorAt: sensor.at,
    steps,
    deltas,
    totalGapLiters: totalGap,
    note:
      'Reconciliación DEMO a partir de custodia + medición. No prueba litros físicos; señala diferencias para auditoría.',
  };
}
