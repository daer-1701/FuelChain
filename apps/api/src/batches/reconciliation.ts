import { Prisma } from '@prisma/client';
import {
  reconcileReceivedEvents,
  type MovementReconciliation,
} from './movement-reconciliation';

type CustodyLike = {
  id?: string;
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
 * Passport quantities.
 * Primary gap = sum of per-movement (declared vs measured on RECEIVED).
 * The lote `declared` figure is a consignment snapshot, not the expected
 * liters of a single cistern drop.
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

  const movements: MovementReconciliation[] = reconcileReceivedEvents(
    input.custodyEvents,
  );
  const movementGap = movements.reduce((sum, m) => {
    if (m.differenceLiters === null) return sum;
    return sum + m.differenceLiters;
  }, 0);
  const latestMovement = movements[movements.length - 1] ?? null;

  const steps = [
    { key: 'declared', label: 'Lote (consignación DEMO)', liters: declared },
    { key: 'received', label: 'Última recepción (movimiento)', liters: received.liters },
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

  return {
    declared,
    received: received.liters,
    stored: stored.liters,
    sensor: sensor.liters,
    sensorSource: sensor.source,
    sensorAt: sensor.at,
    steps,
    deltas,
    movements,
    latestMovement,
    totalGapLiters: movements.length > 0 ? movementGap : 0,
    note:
      'DEMO: la brecha principal es esperado vs recibido de cada movimiento (evento RECEIVED). El volumen del lote no se trata como el de una sola cisterna. Discrepancia ≠ robo.',
  };
}
