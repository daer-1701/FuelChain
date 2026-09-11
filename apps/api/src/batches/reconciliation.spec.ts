import { buildQuantityReconciliation } from './reconciliation';

describe('buildQuantityReconciliation', () => {
  it('builds Declared → Received → Stored → Sensor ladder', () => {
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

    expect(result.declared).toBe(100000);
    expect(result.received).toBe(99900);
    expect(result.stored).toBe(98700);
    expect(result.sensor).toBe(98650);
    expect(result.totalGapLiters).toBe(-1350);
    expect(result.deltas).toHaveLength(3);
  });
});
