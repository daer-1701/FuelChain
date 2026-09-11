import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { CbbaStationsExplorer } from '@/components/cbba-stations-explorer';
import type { PublicStation } from '@/components/station-types';

export const dynamic = 'force-dynamic';

type StationsResponse = {
  label: string;
  city: string;
  note: string;
  data: PublicStation[];
};

export default async function MapaCochabambaPage() {
  let stations: PublicStation[] = [];
  let note = '';
  let error: string | null = null;

  try {
    const res = await apiGet<StationsResponse>(
      '/stations/public?city=Cochabamba',
    );
    stations = res.data;
    note = res.note;
  } catch (e) {
    error = e instanceof Error ? e.message : 'API error';
  }

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">Cochabamba · público DEMO</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">
          Dónde cargar
        </h1>
        <p className="mt-3 max-w-lg leading-relaxed text-[var(--mute)]">
          Clic en un surtidor del mapa o de la lista para ver detalle. Semáforo
          DEMO — no es la app oficial ANH Abastecimiento. {note}
        </p>
      </header>

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      <CbbaStationsExplorer stations={stations} />

      <p className="text-sm text-[var(--mute)]">
        ¿Sos operador?{' '}
        <Link href="/login" className="text-[var(--diesel)] underline">
          Iniciar sesión
        </Link>{' '}
        para simular entregas y custodia QR.
      </p>
    </div>
  );
}
