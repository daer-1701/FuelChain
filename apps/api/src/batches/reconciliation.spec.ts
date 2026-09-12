import { buildQuantityReconciliation } from './reconciliation';

describe('buildQuantityReconciliation', () => {
  it('reconciles each RECEIVED movement, not lote vs a single drop', () => {
    const result = buildQuantityReconciliation({
      declaredVolumeLiters: 100000,
      custodyEvents: [
        {
          id: 'recv-1',
          eventType: 'RECEIVED',
          measuredVolume: 24760,
          declaredVolume: 24800,
        },
        {
          eventType: 'STORED',
          measuredVolume: 24700,
          declaredVolume: null,
        },
      ],
      measurements: [
        {
          volumeLiters: 24650,
          source: 'SIMULATOR',
          timestamp: new Date('2026-09-10T12:00:00Z'),
        },
      ],
    });

    expect(result.declared).toBe(100000);
    expect(result.received).toBe(24760);
    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].expectedLiters).toBe(24800);
    expect(result.movements[0].receivedLiters).toBe(24760);
    expect(result.totalGapLiters).toBe(-40);
    expect(result.latestMovement?.status).toBe('WITHIN_TOLERANCE');
    expect(result.note).toMatch(/movimiento/i);
  });

  it('keeps last-known stage volumes without using them as the primary gap', () => {
    const result = buildQuantityReconciliation({
      declaredVolumeLiters: 100000,
      custodyEvents: [
        {
          eventType: 'RECEIVED',
          measuredVolume: 99900,
          declaredVolume: 100000,
        },
        {
          eventType: 'STORED',
          measuredVolume: 98700,
          declaredVolume: null,
        },
      ],
      measurements: [
        {
          volumeLiters: 98650,
          source: 'SIMULATOR',
          timestamp: new Date('2026-09-10T12:00:00Z'),
        },
      ],
    });

    expect(result.stored).toBe(98700);
    expect(result.sensor).toBe(98650);
    expect(result.totalGapLiters).toBe(-100);
    expect(result.deltas.length).toBeGreaterThan(0);
  });
});
