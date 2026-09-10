import Link from 'next/link';
import {
  formatStatus,
  formatVolume,
  riskClass,
  type DashboardKpis,
} from '@/lib/types';

/** Visual fill for demo volumes (seed ~350k L). */
function tankPercent(liters: string | number): number {
  const n = typeof liters === 'string' ? Number(liters) : liters;
  if (Number.isNaN(n) || n <= 0) return 8;
  return Math.min(94, Math.max(12, (n / 400000) * 100));
}

export function VolumeHero({
  totalVolumeLiters,
  highRisk,
  discrepancies,
}: {
  totalVolumeLiters: string | number;
  highRisk: number;
  discrepancies: number;
}) {
  const fill = tankPercent(totalVolumeLiters);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold tracking-[0.14em] text-[var(--mute)]">
            Volumen en custodia
          </p>
          <p className="font-display mt-1 text-[clamp(2.75rem,8vw,4.5rem)] font-black leading-none tracking-tight tabular-nums">
            {formatVolume(totalVolumeLiters)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 pt-1">
          <span className={`fc-stamp ${riskClass('HIGH')}`}>
            Riesgo alto {highRisk}
          </span>
          <span className="fc-stamp text-[var(--alarm)]">
            Discrepancias {discrepancies}
          </span>
        </div>
      </div>

      <div
        className="fc-tank"
        role="img"
        aria-label={`Tanque al ${Math.round(fill)} por ciento del volumen de referencia`}
      >
        <div className="fc-tank-fill" style={{ width: `${fill}%` }} />
        <div className="fc-tank-label">
          <span>TANQUE</span>
          <span>{Math.round(fill)}%</span>
        </div>
      </div>
    </section>
  );
}

export function StatStrip({ kpis }: { kpis: DashboardKpis['kpis'] }) {
  const items = [
    { label: 'Lotes', value: kpis.totalBatches },
    { label: 'En tránsito', value: kpis.inTransit },
    { label: 'Entregados', value: kpis.delivered },
    { label: 'Certificados', value: kpis.certified },
    { label: 'Auditoría', value: kpis.auditRequired },
  ];

  return (
    <dl className="grid grid-cols-2 border-y-2 border-[var(--ink)] sm:grid-cols-5">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`px-3 py-4 sm:px-4 ${
            i > 0 ? 'border-t border-[var(--rail)]/40 sm:border-t-0 sm:border-l' : ''
          }`}
        >
          <dt className="text-sm text-[var(--mute)]">{item.label}</dt>
          <dd className="font-display mt-1 text-2xl font-bold tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function RecentBatches({
  batches,
}: {
  batches: DashboardKpis['recentBatches'];
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-[var(--rail)]/40 pb-2">
        <h2 className="font-display text-xl font-bold">Lotes recientes</h2>
        <Link
          href="/batches"
          className="text-sm font-medium text-[var(--diesel)] underline-offset-4 hover:underline"
        >
          Ver todos
        </Link>
      </div>
      <div className="fc-surface overflow-x-auto">
        <table className="fc-table min-w-[640px]">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Producto</th>
              <th>Estado</th>
              <th>Riesgo</th>
              <th>Último evento</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link
                    href={`/batches/${b.batchCode}`}
                    className="fc-batch-code text-[var(--diesel)] hover:underline"
                  >
                    {b.batchCode}
                  </Link>
                </td>
                <td>{b.product}</td>
                <td className="capitalize text-[var(--mute)]">
                  {formatStatus(b.status)}
                </td>
                <td className={`font-medium ${riskClass(b.riskLevel)}`}>
                  {b.riskLevel.toLowerCase()} · {b.riskScore}
                </td>
                <td className="text-[var(--mute)]">
                  {b.custodyEvents?.[0]?.eventType
                    ? formatStatus(b.custodyEvents[0].eventType)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RecentAnomalies({
  anomalies,
}: {
  anomalies: DashboardKpis['recentAnomalies'];
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-[var(--rail)]/40 pb-2">
        <h2 className="font-display text-xl font-bold">Señales</h2>
        <Link
          href="/anomalies"
          className="text-sm font-medium text-[var(--diesel)] underline-offset-4 hover:underline"
        >
          Ver centro
        </Link>
      </div>
      <ul className="divide-y divide-[var(--rail)]/35 border border-[var(--rail)]/45 bg-[var(--paper)]">
        {anomalies.length === 0 && (
          <li className="px-4 py-5 text-sm text-[var(--mute)]">
            No hay discrepancias abiertas.
          </li>
        )}
        {anomalies.map((a) => (
          <li key={a.id} className="px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`/batches/${a.batch.batchCode}`}
                className="fc-batch-code text-sm text-[var(--diesel)]"
              >
                {a.batch.batchCode}
              </Link>
              <span className="fc-stamp text-[var(--alarm)]">
                {a.severity.toLowerCase()}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--mute)]">
              {a.difference ?? formatStatus(a.type)}
            </p>
            <p className="mt-1 text-xs text-[var(--mute)]">
              Señal para auditoría humana — no implica culpabilidad.
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
