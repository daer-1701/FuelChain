import { BatchStatus } from '@prisma/client';
import {
  assertCanTransition,
  canIssueQr,
  canReceiveBatch,
  canTransition,
} from './batch-status';

describe('batch-status', () => {
  it('allows IN_TRANSIT → RECEIVED', () => {
    expect(canTransition(BatchStatus.IN_TRANSIT, BatchStatus.RECEIVED)).toBe(
      true,
    );
  });

  it('rejects RECEIVED → IN_TRANSIT', () => {
    expect(canTransition(BatchStatus.RECEIVED, BatchStatus.IN_TRANSIT)).toBe(
      false,
    );
    expect(() =>
      assertCanTransition(BatchStatus.RECEIVED, BatchStatus.IN_TRANSIT),
    ).toThrow(/no permitida/);
  });

  it('issues QR from AUTHORIZED/IN_TRANSIT/RECEIVED but not DRAFT or COMPLETED', () => {
    expect(canIssueQr(BatchStatus.AUTHORIZED)).toBe(true);
    expect(canIssueQr(BatchStatus.IN_TRANSIT)).toBe(true);
    expect(canIssueQr(BatchStatus.RECEIVED)).toBe(true);
    expect(canIssueQr(BatchStatus.DRAFT)).toBe(false);
    expect(canIssueQr(BatchStatus.COMPLETED)).toBe(false);
  });

  it('receives only after the batch is in transit', () => {
    expect(canReceiveBatch(BatchStatus.IN_TRANSIT)).toBe(true);
    expect(canReceiveBatch(BatchStatus.RECEIVED)).toBe(true);
    expect(canReceiveBatch(BatchStatus.AUTHORIZED)).toBe(false);
    expect(canReceiveBatch(BatchStatus.DRAFT)).toBe(false);
    expect(canReceiveBatch(BatchStatus.COMPLETED)).toBe(false);
  });
});
