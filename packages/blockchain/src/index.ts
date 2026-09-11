/**
 * Optional helpers for blockchain messaging.
 * Live anchoring runs in apps/api via viem + contracts/FuelChain.sol.
 */

export const CHAIN_PURPOSE =
  'Tamper-evident audit layer for custody events and document hashes — not an operational database.';

export type AnchorPayload = {
  batchId: string;
  eventId: string;
  timestamp: string;
  actor: string;
  hash: `0x${string}`;
};
