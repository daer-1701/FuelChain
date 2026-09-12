import Link from 'next/link';
import { AnomalyStatusControl } from '@/components/anomaly-status-control';
import { apiGet } from '@/lib/api';
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
    error = e instanceof Error ? e.message : 'API error';
  }

  return (
    <div className="space-y-8">
      <header className="max-w-xl">
        <h1 className="font-display text-3xl font-black tracking-tight">
          Discrepancias
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          Diferencias entre lo declarado, recibido y medido. Son señales para
          revisar — el sistema no atribuye robo ni corrupción. El auditor cambia
          el estado; la estación solo consulta.
        </p>
      </header>

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      {!error && data.length === 0 && (
        <p className="text-[var(--mute)]">No hay discrepancias registradas.</p>
      )}

      {data.length > 0 && (
        <section className="fc-surface overflow-x-auto">
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
                <tr key={a.id}>
                  <td>
                    <span className="fc-stamp text-[var(--alarm)]">
                      {a.severity.toLowerCase()}
                    </span>
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
                  <td>{a.difference ?? '—'}</td>
                  <td>
                    {a.batch.riskLevel.toLowerCase()} · {a.batch.riskScore}
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
