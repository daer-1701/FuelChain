import Link from 'next/link';
import {
  MetricRail,
  OpsPageHeader,
  StatusPill,
} from '@/components/ops';
import { apiGet } from '@/lib/api';
import { riskLabel } from '@/lib/es-labels';
import { formatStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type AuditsResponse = {
  data: Array<{
    id: string;
    title: string;
    status: string;
    riskScore: number;
    batch: { batchCode: string; product: string };
    anomaly: { type: string; severity: string } | null;
  }>;
};

function auditStatusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'OPEN' || s === 'IN_REVIEW') return 'warn' as const;
  if (s === 'CLOSED' || s === 'RESOLVED') return 'ok' as const;
  return 'mute' as const;
}

export default async function AuditsPage() {
  let data: AuditsResponse['data'] = [];
  let error: string | null = null;
  try {
    const res = await apiGet<AuditsResponse>('/audits');
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error de API';
  }

  const open = data.filter((c) => {
    const s = c.status.toUpperCase();
    return s !== 'CLOSED' && s !== 'RESOLVED';
  }).length;
  const withAnomaly = data.filter((c) => c.anomaly).length;
  const highRisk = data.filter((c) => c.riskScore >= 70).length;

  return (
    <div className="fc-page">
      <OpsPageHeader
        stamp="Auditor · casos humanos"
        title="Auditorías"
        lede="Casos abiertos por personas. La decisión final es humana."
        actions={
          <Link href="/anomalies" className="fc-btn fc-btn-ghost !text-xs">
            Discrepancias
          </Link>
        }
      />

      <MetricRail
        items={[
          { label: 'Casos', value: String(data.length) },
          {
            label: 'Abiertos',
            value: String(open),
            tone: open > 0 ? 'warn' : 'ok',
          },
          {
            label: 'Con discrepancia',
            value: String(withAnomaly),
            tone: withAnomaly > 0 ? 'info' : 'mute',
          },
          {
            label: 'Riesgo alto',
            value: String(highRisk),
            tone: highRisk > 0 ? 'danger' : 'ok',
          },
        ]}
      />

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      {data.length === 0 && !error ? (
        <p className="text-[var(--mute)]">No hay auditorías registradas.</p>
      ) : (
        <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
          {data.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-start justify-between gap-4 py-5 fc-ops-rise"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/audits/${c.id}`}
                    className="font-display text-lg font-bold hover:text-[var(--diesel)]"
                  >
                    {c.title}
                  </Link>
                  <StatusPill
                    label={formatStatus(c.status)}
                    tone={auditStatusTone(c.status)}
                  />
                </div>
                <p className="fc-batch-code mt-2 text-sm text-[var(--diesel)]">
                  {c.batch.batchCode}
                </p>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  {c.anomaly
                    ? `${riskLabel(c.anomaly.severity)} · ${formatStatus(c.anomaly.type)}`
                    : 'Sin discrepancia vinculada'}
                </p>
              </div>
              <div className="text-right">
                <StatusPill
                  label={`Riesgo ${c.riskScore}`}
                  tone={
                    c.riskScore >= 70
                      ? 'danger'
                      : c.riskScore >= 40
                        ? 'warn'
                        : 'ok'
                  }
                  pulse={c.riskScore >= 70}
                />
                <p className="mt-2 text-xs text-[var(--mute)]">
                  {c.batch.product}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
