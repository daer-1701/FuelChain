/**
 * DEMO movement reconciliation — compares one custody handoff, not the
 * whole import consignment vs a single cistern drop.
 * Discrepancy is a human-audit signal, never theft/fraud.
 */

export const DEMO_TOLERANCE_RATIO = 0.005;
export const DEMO_TOLERANCE_MIN_LITERS = 20;

export type MovementReconStatus =
  | 'MATCH'
  | 'WITHIN_TOLERANCE'
  | 'ANOMALY'
  | 'INCOMPLETE';

export type MovementReconciliation = {
  scope: 'movement';
  custodyEventId: string | null;
  expectedLiters: number | null;
  receivedLiters: number | null;
  differenceLiters: number | null;
  absDifferenceLiters: number | null;
  status: MovementReconStatus;
  toleranceLiters: number | null;
  note: string;
  label: 'DEMO';
};

function toNum(v: { toString(): string } | string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

export function demoToleranceLiters(expectedLiters: number): number {
  return Math.max(expectedLiters * DEMO_TOLERANCE_RATIO, DEMO_TOLERANCE_MIN_LITERS);
}

export function reconcileMovement(input: {
  expectedLiters: number | string | { toString(): string } | null | undefined;
  receivedLiters: number | string | { toString(): string } | null | undefined;
  custodyEventId?: string | null;
}): MovementReconciliation {
  const expected = toNum(input.expectedLiters);
  const received = toNum(input.receivedLiters);
  const noteBase =
    'Reconciliación DEMO del movimiento (esperado vs recibido). Discrepancia ≠ robo; requiere revisión humana.';

  if (expected === null || received === null) {
    return {
      scope: 'movement',
      custodyEventId: input.custodyEventId ?? null,
      expectedLiters: expected,
      receivedLiters: received,
      differenceLiters: null,
      absDifferenceLiters: null,
      status: 'INCOMPLETE',
      toleranceLiters: expected !== null ? demoToleranceLiters(expected) : null,
      note: `${noteBase} Faltan litros esperados o recibidos.`,
      label: 'DEMO',
    };
  }

  const difference = received - expected;
  const abs = Math.abs(difference);
  const tolerance = demoToleranceLiters(expected);
  let status: MovementReconStatus = 'ANOMALY';
  if (abs < 0.0005) status = 'MATCH';
  else if (abs <= tolerance) status = 'WITHIN_TOLERANCE';

  return {
    scope: 'movement',
    custodyEventId: input.custodyEventId ?? null,
    expectedLiters: expected,
    receivedLiters: received,
    differenceLiters: difference,
    absDifferenceLiters: abs,
    status,
    toleranceLiters: tolerance,
    note: noteBase,
    label: 'DEMO',
  };
}

export function reconcileReceivedEvents(
  events: Array<{
    id?: string;
    eventType: string;
    declaredVolume?: { toString(): string } | string | number | null;
    measuredVolume?: { toString(): string } | string | number | null;
  }>,
): MovementReconciliation[] {
  return events
    .filter((e) => e.eventType === 'RECEIVED')
    .map((e) =>
      reconcileMovement({
        expectedLiters: e.declaredVolume,
        receivedLiters: e.measuredVolume,
        custodyEventId: e.id ?? null,
      }),
    );
}
