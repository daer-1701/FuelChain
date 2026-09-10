/**
 * Blockchain client helpers stub (PHASE 1).
 * Real ABI / viem wiring lands in PHASE 11–12.
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
