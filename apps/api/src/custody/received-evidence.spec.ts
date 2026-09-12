import { keccak256, stringToHex } from 'viem';
import {
  buildCustodyReceivedEvidence,
  canonicalCustodyReceivedJson,
} from './received-evidence';

describe('custody received evidence', () => {
  const base = {
    batchId: 'batch-1',
    batchCode: 'FC-BO-2026-000182',
    custodyEventId: 'evt-1',
    from: 'CIS-CBB-07',
    to: 'Estación ST-CBB-01 (Cochabamba)',
    volumeLiters: 24760,
    expectedVolumeLiters: 24800,
    occurredAt: '2026-09-11T20:30:00.000Z',
    actorId: 'user-station',
  };

  it('is deterministic regardless of object key insertion order', () => {
    const a = canonicalCustodyReceivedJson(buildCustodyReceivedEvidence(base));
    const b = canonicalCustodyReceivedJson(
      buildCustodyReceivedEvidence({
        volumeLiters: base.volumeLiters,
        actorId: base.actorId,
        occurredAt: base.occurredAt,
        batchCode: base.batchCode,
        to: base.to,
        from: base.from,
        expectedVolumeLiters: base.expectedVolumeLiters,
        custodyEventId: base.custodyEventId,
        batchId: base.batchId,
      }),
    );
    expect(a).toBe(b);
  });

  it('uses only existing identifiers', () => {
    const ev = buildCustodyReceivedEvidence(base);
    expect(ev.schema).toBe('fuelchain.custody.received.v1');
    expect(ev.custodyEventId).toBe('evt-1');
    expect(ev.label).toBe('DEMO');
  });

  it('produces a stable keccak hash for the same event', () => {
    const hash = () =>
      keccak256(
        stringToHex(
          canonicalCustodyReceivedJson(buildCustodyReceivedEvidence(base)),
        ),
      );
    expect(hash()).toBe(hash());
  });
});
