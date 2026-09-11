/**
 * Optional shared constants for FuelChain.
 * Apps currently use Prisma enums + local types; this package is available for cross-app reuse.
 */

export const APP_NAME = 'FuelChain Bolivia';
export const APP_TAGLINE = 'Cada litro. Cada movimiento. Cada evidencia.';
export const BATCH_CODE_PREFIX = 'FC-BO';
export const DEMO_LABEL = 'DEMO' as const;

export function formatBatchCode(year: number, sequence: number): string {
  return `${BATCH_CODE_PREFIX}-${year}-${String(sequence).padStart(6, '0')}`;
}
