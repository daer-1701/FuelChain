import Link from 'next/link';
import { AnomalyStatusControl } from '@/components/anomaly-status-control';
import {
  MetricRail,
  OpsPageHeader,
  StatusPill,
  riskToneFrom,
  severityToneFrom,
} from '@/components/ops';
import { apiGet } from '@/lib/api';
import { riskLabel } from '@/lib/es-labels';
import { formatStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type AnomaliesResponse = {
  data: Array<{
    id: string;
    type: string;
    severity: string;
    status: string;
    expected: string | null;
    actual: string | null;
    difference: string | null;
    batch: { batchCode: string; riskLevel: string; riskScore: number };
  }>;
};

export default async function AnomaliesPage() {
  let data: AnomaliesResponse['data'] = [];
  let error: string | null = null;
  try {
    const res = await apiGet<AnomaliesResponse>('/anomalies');
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error de API';
  }

  const open = data.filter(
    (a) =>
      a.status.toUpperCase() !== 'RESOLVED' &&
      a.status.toUpperCase() !== 'CLOSED',
  ).length;
  const high = data.filter(
    (a) =>
      a.severity.toUpperCase() === 'HIGH' ||
      a.severity.toUpperCase() === 'CRITICAL',
  ).length;
  const resolved = data.length - open;

  return (
    <div className="fc-page">
      <OpsPageHeader
        stamp="Auditor · señales de reconciliación"
        title="Discrepancias"
        lede="Diferencias entre lo declarado, recibido y medido. Son señales para revisar — el sistema no atribuye robo ni corrupción. El auditor cambia el estado; la estación solo consulta."
        actions={
          <Link href="/audits" className="fc-btn fc-btn-ghost !text-xs">
            Auditorías
          </Link>
        }
      />

      <MetricRail
        items={[
          { label: 'Total', value: String(data.length) },
          {
            label: 'Abiertas',
            value: String(open),
            tone: open > 0 ? 'warn' : 'ok',
          },
          {
            label: 'Severidad alta',
            value: String(high),
            tone: high > 0 ? 'danger' : 'ok',
          },
          {
            label: 'Cerradas',
            value: String(resolved),
            tone: 'mute',
          },
        ]}
      />

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      {!error && data.length === 0 && (
        <p className="text-[var(--mute)]">No hay discrepancias registradas.</p>
      )}

      {data.length > 0 && (
        <section className="overflow-x-auto border-2 border-[var(--ink)]">
          <table className="fc-table min-w-[800px]">
            <thead>
              <tr>
                <th>Severidad</th>
                <th>Lote</th>
                <th>Tipo</th>
                <th>Esperado</th>
                <th>Actual</th>
                <th>Diferencia</th>
                <th>Riesgo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="fc-ops-rise">
                  <td>
                    <StatusPill
                      label={riskLabel(a.severity)}
                      tone={severityToneFrom(a.severity)}
                      pulse={
                        a.severity.toUpperCase() === 'HIGH' ||
                        a.severity.toUpperCase() === 'CRITICAL'
                      }
                    />
                  </td>
                  <td>
                    <Link
                      href={`/batches/${a.batch.batchCode}`}
                      className="fc-batch-code text-[var(--diesel)]"
                    >
                      {a.batch.batchCode}
                    </Link>
                  </td>
                  <td className="capitalize">{formatStatus(a.type)}</td>
                  <td className="text-[var(--mute)]">{a.expected ?? '—'}</td>
                  <td className="text-[var(--mute)]">{a.actual ?? '—'}</td>
                  <td className="tabular-nums font-semibold">
                    {a.difference ?? '—'}
                  </td>
                  <td>
                    <StatusPill
                      label={`${riskLabel(a.batch.riskLevel)} · ${a.batch.riskScore}`}
                      tone={riskToneFrom(a.batch.riskLevel)}
                    />
                  </td>
                  <td>
                    <AnomalyStatusControl
                      anomalyId={a.id}
                      currentStatus={a.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
