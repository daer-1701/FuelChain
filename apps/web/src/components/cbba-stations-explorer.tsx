'use client';

import { useEffect, useId, useState } from 'react';
import { CbbaLeafletMap } from '@/components/cbba-map';
import type { PublicStation } from '@/components/station-types';

const tone: Record<PublicStation['availability'], string> = {
  FULL: 'bg-[var(--ok,#1a7a3c)]',
  MEDIUM: 'bg-[var(--diesel)]',
  LOW: 'bg-[var(--warn,#c47a00)]',
  EMPTY: 'bg-[var(--alarm)]',
  UNKNOWN: 'bg-[var(--mute)]',
};

const toneText: Record<PublicStation['availability'], string> = {
  FULL: 'text-[var(--ok,#1a7a3c)]',
  MEDIUM: 'text-[var(--diesel)]',
  LOW: 'text-[var(--warn,#c47a00)]',
  EMPTY: 'text-[var(--alarm)]',
  UNKNOWN: 'text-[var(--mute)]',
};

function StationDetail({
  station,
  onClose,
}: {
  station: PublicStation;
  onClose: () => void;
}) {
  const titleId = useId();
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${station.latitude}&mlon=${station.longitude}#map=16/${station.latitude}/${station.longitude}`;

  return (
    <aside
      className="fc-sheet sticky top-4 space-y-4 border-2 border-[var(--ink)]"
      aria-labelledby={titleId}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="fc-stamp text-[var(--mute)]">{station.code}</p>
          <h2 id={titleId} className="mt-1 font-display text-2xl font-black">
            {station.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 border border-[var(--ink)] px-2 py-1 text-xs font-semibold"
          aria-label="Cerrar detalle"
        >
          Cerrar
        </button>
      </div>

      <p className={`font-display text-3xl font-black ${toneText[station.availability]}`}>
        {station.publicLevel}
      </p>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
            Municipio
          </dt>
          <dd className="mt-0.5 font-medium">
            {station.municipality ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
            Dirección
          </dt>
          <dd className="mt-0.5 font-medium">{station.address ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
            Productos
          </dt>
          <dd className="mt-0.5 font-medium">
            {station.products.length ? station.products.join(' · ') : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
            Última actualización
          </dt>
          <dd className="mt-0.5 font-medium">
            {station.lastInventoryAt
              ? new Date(station.lastInventoryAt).toLocaleString('es-BO')
              : 'Sin reporte reciente'}
          </dd>
        </div>
        {station.tankName && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
              Tanque (DEMO)
            </dt>
            <dd className="mt-0.5 font-medium">{station.tankName}</dd>
          </div>
        )}
        {station.fillPercent != null && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
              Nivel estimado
            </dt>
            <dd className="mt-2">
              <div className="h-3 w-full border border-[var(--ink)] bg-[var(--haze)]">
                <div
                  className={`h-full ${tone[station.availability]}`}
                  style={{ width: `${Math.min(100, station.fillPercent)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--mute)]">
                Indicador interno DEMO {station.fillPercent}% — el público ve
                semáforo, no litros exactos.
              </p>
            </dd>
          </div>
        )}
        {station.temperature != null && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
              Temperatura proxy
            </dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {Number(station.temperature).toFixed(1)} °C
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
            Agua detectada (proxy)
          </dt>
          <dd
            className={`mt-0.5 font-medium ${
              station.waterDetected ? 'text-[var(--alarm)]' : ''
            }`}
          >
            {station.waterDetected ? 'Sí — revisar (DEMO)' : 'No'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--mute)]">
            Coordenadas
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums text-xs">
            {Number(station.latitude).toFixed(5)},{' '}
            {Number(station.longitude).toFixed(5)}
          </dd>
        </div>
      </dl>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block border-2 border-[var(--ink)] px-3 py-2 text-sm font-semibold"
      >
        Abrir en OpenStreetMap
      </a>
      <p className="text-xs text-[var(--mute)]">
        Datos DEMO FuelChain. No sustituye la app oficial ANH Abastecimiento.
      </p>
    </aside>
  );
}

export function CbbaStationsExplorer({
  stations,
}: {
  stations: PublicStation[];
}) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && stations.some((s) => s.code === hash)) {
      setSelectedCode(hash);
    }
  }, [stations]);

  function select(code: string) {
    setSelectedCode(code);
    window.history.replaceState(null, '', `#${code}`);
  }

  function clear() {
    setSelectedCode(null);
    window.history.replaceState(null, '', window.location.pathname);
  }

  const selected = stations.find((s) => s.code === selectedCode) ?? null;

  if (!stations.length) {
    return (
      <p className="text-sm text-[var(--mute)]">
        Sin estaciones. Corré el seed DEMO.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CbbaLeafletMap
          stations={stations}
          selectedCode={selectedCode}
          onSelect={select}
        />
        {selected ? (
          <StationDetail station={selected} onClose={clear} />
        ) : (
          <aside className="flex items-center border border-dashed border-[var(--rail)] px-5 py-8 text-sm text-[var(--mute)]">
            Tocá un punto del mapa o una estación de la lista para ver
            dirección, productos, semáforo y última actualización.
          </aside>
        )}
      </div>

      <ul className="space-y-2">
        {stations.map((s) => {
          const active = s.code === selectedCode;
          return (
            <li key={s.code}>
              <button
                type="button"
                id={s.code}
                onClick={() => select(s.code)}
                aria-pressed={active}
                className={`flex w-full flex-wrap items-start justify-between gap-4 border-b px-2 py-4 text-left transition-colors ${
                  active
                    ? 'border-[var(--diesel)] bg-[var(--diesel-soft)]'
                    : 'border-[var(--rail)]/50 hover:bg-[var(--paper)]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${tone[s.availability]}`}
                      aria-hidden
                    />
                    <span className="font-display text-xl font-bold">
                      {s.name}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--mute)]">
                    {s.code} · {s.municipality}
                    {s.address ? ` · ${s.address}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[var(--mute)]">
                    {s.products.join(' · ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-black">
                    {s.publicLevel}
                  </p>
                  <p className="text-xs text-[var(--diesel)]">Ver detalle →</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
