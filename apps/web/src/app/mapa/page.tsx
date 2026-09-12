import { apiGet } from '@/lib/api';
import { CbbaStationsExplorer } from '@/components/cbba-stations-explorer';
import { MapaRoleCta } from '@/components/mapa-role-cta';
import { MetricRail, OpsPageHeader } from '@/components/ops';
import type { PublicStation } from '@/components/station-types';

export const dynamic = 'force-dynamic';

type StationsResponse = {
  label: string;
  city: string;
  departments?: string[];
  note: string;
  data: PublicStation[];
};

export default async function MapaBoliviaPage() {
  let stations: PublicStation[] = [];
  let departments: string[] = [];
  let error: string | null = null;

  try {
    const res = await apiGet<StationsResponse>('/stations/public?city=all');
    stations = res.data;
    departments = res.departments ?? [
      ...new Set(stations.map((s) => s.city).filter(Boolean) as string[]),
    ];
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudo cargar el mapa.';
  }

  const low = stations.filter(
    (s) => s.availability === 'LOW' || s.availability === 'EMPTY',
  ).length;
  const qualityAlert = stations.filter(
    (s) => s.qualityTone === 'ALERTA' || s.qualityTone === 'RECHAZADO',
  ).length;
  const withStock = stations.filter(
    (s) => s.availability === 'FULL' || s.availability === 'MEDIUM',
  ).length;

  return (
    <div className="fc-page">
      <OpsPageHeader
        stamp="Ciudadano · mapa público DEMO"
        title="Surtidores en Bolivia"
        lede="Resultado del camino trazable: tocá un surtidor y mirá cantidad y calidad disponibles. Información orientativa DEMO — no es la app oficial ANH."
      />

      <MetricRail
        items={[
          {
            label: 'Surtidores',
            value: String(stations.length),
            hint: 'Bolivia DEMO',
          },
          {
            label: 'Con stock',
            value: String(withStock),
            tone: 'ok',
          },
          {
            label: 'Stock bajo / vacío',
            value: String(low),
            tone: low > 0 ? 'warn' : 'ok',
          },
          {
            label: 'Señal calidad',
            value: String(qualityAlert),
            tone: qualityAlert > 0 ? 'danger' : 'ok',
          },
        ]}
      />

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      <CbbaStationsExplorer
        stations={stations}
        departments={departments}
      />

      <MapaRoleCta />
    </div>
  );
}
