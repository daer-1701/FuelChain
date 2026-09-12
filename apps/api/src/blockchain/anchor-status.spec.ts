import {
  ANCHOR_FAILED_MARKER,
  deriveAnchorStatus,
  networkLabel,
  selectReusableAnchor,
} from './anchor-status';

describe('deriveAnchorStatus', () => {
  it('is CONFIRMED when a transaction hash exists', () => {
    expect(
      deriveAnchorStatus({
        transactionHash: '0xabc',
        actorWallet: ANCHOR_FAILED_MARKER,
      }),
    ).toBe('CONFIRMED');
  });

  it('is FAILED when marked and no tx', () => {
    expect(
      deriveAnchorStatus({
        transactionHash: null,
        actorWallet: ANCHOR_FAILED_MARKER,
      }),
    ).toBe('FAILED');
  });

  it('is PENDING otherwise', () => {
    expect(deriveAnchorStatus({ transactionHash: null, actorWallet: null })).toBe(
      'PENDING',
    );
  });
});

describe('networkLabel', () => {
  it('labels local Hardhat and HSK testnet', () => {
    expect(networkLabel(31337)).toBe('hardhat (DEMO local)');
    expect(networkLabel(133)).toBe('HashKey Chain Testnet');
  });
});

describe('selectReusableAnchor', () => {
  const eventId = 'evt-1';
  const dataHash = '0xhash';

  it('prefers a confirmed row for the same event and hash', () => {
    const confirmed = {
      eventId,
      dataHash,
      transactionHash: '0xtx',
    };
    const pending = { eventId, dataHash, transactionHash: null };
    expect(selectReusableAnchor([pending, confirmed], eventId, dataHash)).toBe(
      confirmed,
    );
  });

  it('reuses another confirmed row with the same hash', () => {
    const other = {
      eventId: 'other',
      dataHash,
      transactionHash: '0xtx',
    };
    expect(selectReusableAnchor([other], eventId, dataHash)).toBe(other);
  });

  it('returns the pending/failed row for retry when hashes match', () => {
    const pending = { eventId, dataHash, transactionHash: null };
    expect(selectReusableAnchor([pending], eventId, dataHash)).toBe(pending);
  });
});
