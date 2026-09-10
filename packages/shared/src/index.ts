/**
 * Shared FuelChain types & constants.
 */

export const APP_NAME = 'FuelChain Bolivia';
export const APP_TAGLINE = 'Cada litro. Cada movimiento. Cada evidencia.';

/** DEMO: batch code pattern FC-BO-YYYY-###### */
export const BATCH_CODE_PREFIX = 'FC-BO';

export function formatBatchCode(year: number, sequence: number): string {
  return `${BATCH_CODE_PREFIX}-${year}-${String(sequence).padStart(6, '0')}`;
}

export type ActorRole =
  | 'ADMIN'
  | 'IMPORTER'
  | 'TRANSPORTER'
  | 'DEPOT_OPERATOR'
  | 'LAB'
  | 'AUDITOR';

export type TransportType = 'TRUCK' | 'RAIL' | 'WATER' | 'PIPELINE' | 'OTHER';

export type CustodyEventType =
  | 'CREATED'
  | 'LOADED'
  | 'INSPECTED'
  | 'IN_TRANSIT'
  | 'ENTERED_COUNTRY'
  | 'CUSTOMS'
  | 'RECEIVED'
  | 'SAMPLED'
  | 'LAB_ANALYSIS'
  | 'CERTIFIED'
  | 'STORED'
  | 'DISPATCHED'
  | 'DELIVERED';

export type MeasurementSource = 'ESP32' | 'SIMULATOR' | 'MANUAL';

export type AnomalyStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'FALSE_POSITIVE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** DEMO label — never present fictional data as official */
export const DEMO_LABEL = 'DEMO' as const;
