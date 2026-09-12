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
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">Ciudadano · mapa público DEMO</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">
          Surtidores en Bolivia
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--mute)]">
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
