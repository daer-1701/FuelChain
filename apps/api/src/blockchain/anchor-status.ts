/** App-level anchor lifecycle. No Prisma enum — actorWallet === FAILED is the error marker. */
export const ANCHOR_FAILED_MARKER = 'FAILED';
export const CUSTODY_RECEIVED_EVENT_KIND = 'CustodyEventRegistered';

export type AnchorLifecycle = 'PENDING' | 'FAILED' | 'CONFIRMED';

export function deriveAnchorStatus(row: {
  transactionHash?: string | null;
  actorWallet?: string | null;
}): AnchorLifecycle {
  if (row.transactionHash) return 'CONFIRMED';
  if (row.actorWallet === ANCHOR_FAILED_MARKER) return 'FAILED';
  return 'PENDING';
}

export function networkLabel(chainId: number | null | undefined): string {
  if (chainId === 31337) return 'hardhat (DEMO local)';
  if (chainId === 133) return 'HashKey Chain Testnet';
  if (chainId == null) return 'unknown';
  return `chain ${chainId}`;
}

export function selectReusableAnchor<
  T extends {
    eventId?: string | null;
    dataHash: string;
    transactionHash?: string | null;
  },
>(rows: T[], eventId: string, dataHash: string): T | undefined {
  const confirmedSame = rows.find(
    (r) =>
      r.eventId === eventId &&
      r.dataHash === dataHash &&
      Boolean(r.transactionHash),
  );
  if (confirmedSame) return confirmedSame;

  const confirmedHash = rows.find(
    (r) => r.dataHash === dataHash && Boolean(r.transactionHash),
  );
  if (confirmedHash) return confirmedHash;

  return rows.find((r) => r.eventId === eventId && r.dataHash === dataHash);
}
