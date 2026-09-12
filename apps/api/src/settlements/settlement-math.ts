import { Prisma } from '@prisma/client';

/** Tarifa DEMO Bs/L — pitch feria, no tarifa regulada. */
export const DEMO_RATE_BOB_PER_LITER = 0.35;

export function settlementAmountBob(liters: number): number {
  const n = Number.isFinite(liters) ? Math.max(0, liters) : 0;
  return Math.round(n * DEMO_RATE_BOB_PER_LITER * 100) / 100;
}

export function settlementCreateData(input: {
  deliveryId: string;
  driverId?: string | null;
  cisternId: string;
  stationId: string;
  batchId: string;
  liters: number;
}) {
  const liters = Math.max(0, input.liters);
  const amount = settlementAmountBob(liters);
  return {
    deliveryId: input.deliveryId,
    driverId: input.driverId ?? null,
    cisternId: input.cisternId,
    stationId: input.stationId,
    batchId: input.batchId,
    liters: new Prisma.Decimal(liters),
    ratePerLiter: new Prisma.Decimal(DEMO_RATE_BOB_PER_LITER),
    amountBob: new Prisma.Decimal(amount),
    currency: 'BOB',
    status: 'PENDING' as const,
    evidenceNote:
      'Liquidación DEMO al completar la entrega. No es un pago bancario real.',
    isDemo: true,
  };
}
