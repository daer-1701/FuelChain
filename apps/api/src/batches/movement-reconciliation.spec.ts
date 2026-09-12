import {
  DEMO_TOLERANCE_MIN_LITERS,
  reconcileMovement,
} from './movement-reconciliation';

describe('reconcileMovement', () => {
  it('matches equal expected and received', () => {
    const r = reconcileMovement({
      expectedLiters: 24800,
      receivedLiters: 24800,
      custodyEventId: 'e1',
    });
    expect(r.status).toBe('MATCH');
    expect(r.differenceLiters).toBe(0);
    expect(r.scope).toBe('movement');
  });

  it('treats a small DEMO gap as WITHIN_TOLERANCE', () => {
    const r = reconcileMovement({
      expectedLiters: 24800,
      receivedLiters: 24780,
    });
    expect(r.status).toBe('WITHIN_TOLERANCE');
    expect(r.toleranceLiters).toBeGreaterThanOrEqual(DEMO_TOLERANCE_MIN_LITERS);
  });

  it('flags a large gap as ANOMALY without calling it theft', () => {
    const r = reconcileMovement({
      expectedLiters: 24800,
      receivedLiters: 20000,
    });
    expect(r.status).toBe('ANOMALY');
    expect(r.note).toMatch(/≠ robo|no.*robo/i);
  });

  it('does not use a batch consignment as implied expected', () => {
    const r = reconcileMovement({
      expectedLiters: 24800,
      receivedLiters: 24760,
    });
    expect(r.expectedLiters).toBe(24800);
    expect(r.expectedLiters).not.toBe(100000);
  });
});
