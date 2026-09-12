import { apiGet } from '@/lib/api';
import { CbbaStationsExplorer } from '@/components/cbba-stations-explorer';
import { MapaRoleCta } from '@/components/mapa-role-cta';
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

  return (
    <div className="fc-page">
      <header className="fc-page-header">
        <p className="fc-stamp text-[var(--mute)]">Ciudadano · mapa público DEMO</p>
        <h1 className="fc-title fc-title-lg mt-2">
          Surtidores en Bolivia
        </h1>
        <p className="fc-lede">
          Resultado del camino trazable: tocá un surtidor y mirá cantidad y
          calidad disponibles. Información orientativa DEMO — no es la app
          oficial ANH.
        </p>
      </header>

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
