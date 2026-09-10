import {
  RecentAnomalies,
  RecentBatches,
  StatStrip,
  VolumeHero,
} from '@/components/dashboard-widgets';
import { apiGet } from '@/lib/api';
import type { DashboardKpis } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let data: DashboardKpis | null = null;
  let error: string | null = null;

  try {
    data = await apiGet<DashboardKpis>('/dashboard/kpis');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API unavailable';
  }

  return (
    <div className="space-y-10">
      {error && (
        <div
          role="alert"
          className="border border-[var(--alarm)] bg-[var(--alarm-soft)] px-4 py-3 text-sm"
        >
          No se pudo cargar el resumen ({error}). Arranca la API en el puerto
          3001 e intenta de nuevo.
        </div>
      )}

      {data && (
        <>
          <div className="fc-sheet space-y-6">
            <p className="max-w-md text-sm leading-relaxed text-[var(--mute)]">
              Sigue lotes importados, custodia y mediciones. La evidencia en
              cadena registra hashes — no demuestra litros físicos por sí sola.
            </p>
            <VolumeHero
              totalVolumeLiters={data.kpis.totalVolumeLiters}
              highRisk={data.kpis.highRisk}
              discrepancies={data.kpis.discrepancies}
            />
          </div>
          <StatStrip kpis={data.kpis} />
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <RecentBatches batches={data.recentBatches} />
            <RecentAnomalies anomalies={data.recentAnomalies} />
          </div>
        </>
      )}
    </div>
  );
}
