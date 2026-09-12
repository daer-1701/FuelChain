import { labelEs } from '@/lib/es-labels';

export type DashboardKpis = {
  label: string;
  kpis: {
    totalBatches: number;
    inTransit: number;
    delivered: number;
    certified: number;
    auditRequired: number;
    highRisk: number;
    totalVolumeLiters: string | number;
    discrepancies: number;
  };
  recentBatches: Array<{
    id: string;
    batchCode: string;
    product: string;
    status: string;
    riskLevel: string;
    riskScore: number;
    originCountry: string;
    declaredVolumeLiters: string | number;
    currentLocation: string | null;
    custodyEvents?: Array<{ eventType: string; timestamp: string }>;
  }>;
  recentAnomalies: Array<{
    id: string;
    type: string;
    severity: string;
    status: string;
    difference: string | null;
    batch: { batchCode: string; product: string };
  }>;
};

export type BatchesList = {
  data: Array<{
    id: string;
    batchCode: string;
    product: string;
    originCountry: string;
    declaredVolumeLiters: string | number;
    status: string;
    qualityStatus: string;
    riskLevel: string;
    riskScore: number;
    currentLocation: string | null;
    lastEvent: { eventType: string; timestamp: string } | null;
  }>;
  meta: { total: number; page: number; pageSize: number; pageCount: number };
};

export function formatVolume(v: string | number): string {
  const n = typeof v === 'string' ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  return `${n.toLocaleString('es-BO')} L`;
}

export function formatStatus(status: string): string {
  return labelEs(status);
}

export function riskClass(level: string): string {
  switch (level?.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return 'text-[var(--alarm)]';
    case 'MEDIUM':
      return 'text-[var(--diesel)]';
    default:
      return 'text-[var(--seal)]';
  }
}
