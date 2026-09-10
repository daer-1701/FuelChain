import Link from 'next/link';
import { apiGet } from '@/lib/api';
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

export default async function AuditsPage() {
  let data: AuditsResponse['data'] = [];
  let error: string | null = null;
  try {
    const res = await apiGet<AuditsResponse>('/audits');
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : 'API error';
  }

  return (
    <div className="space-y-8">
      <header className="max-w-xl">
        <h1 className="font-display text-3xl font-black tracking-tight">
          Auditorías
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          Casos abiertos por personas. La decisión final es humana.
        </p>
      </header>

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
        {data.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
            <div>
              <Link
                href={`/audits/${c.id}`}
                className="font-display text-lg font-bold hover:text-[var(--diesel)]"
              >
                {c.title}
              </Link>
              <p className="fc-batch-code mt-2 text-sm text-[var(--diesel)]">
                {c.batch.batchCode}
              </p>
              <p className="mt-1 text-sm text-[var(--mute)]">
                {c.anomaly
                  ? `${c.anomaly.severity.toLowerCase()} · ${formatStatus(c.anomaly.type)}`
                  : 'Sin discrepancia vinculada'}
              </p>
            </div>
            <p className="text-right text-sm">
              <span className="text-[var(--mute)]">Riesgo</span>
              <span className="mt-1 block font-display text-2xl font-black tabular-nums text-[var(--alarm)]">
                {c.riskScore}
              </span>
              <span className="capitalize text-[var(--mute)]">
                {formatStatus(c.status)}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
