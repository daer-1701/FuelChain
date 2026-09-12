'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { CbbaLeafletMap } from '@/components/cbba-map';
import type { PublicStation } from '@/components/station-types';

const AVAIL_META: Record<
  PublicStation['availability'],
  { label: string; hint: string; dot: string; text: string }
> = {
  FULL: {
    label: 'Hay combustible',
    hint: 'Stock alto',
    dot: 'bg-[var(--ok,#1a7a3c)]',
    text: 'text-[var(--ok,#1a7a3c)]',
  },
  MEDIUM: {
    label: 'Queda stock',
    hint: 'Nivel medio',
    dot: 'bg-[var(--diesel)]',
    text: 'text-[var(--diesel)]',
  },
  LOW: {
    label: 'Poco stock',
    hint: 'Puede agotarse pronto',
    dot: 'bg-[var(--warn,#c47a00)]',
    text: 'text-[var(--warn,#c47a00)]',
  },
  EMPTY: {
    label: 'Sin combustible',
    hint: 'No hay stock reportado',
    dot: 'bg-[var(--alarm)]',
    text: 'text-[var(--alarm)]',
  },
  UNKNOWN: {
    label: 'Sin dato',
    hint: 'Aún no hay reporte',
    dot: 'bg-[var(--mute)]',
    text: 'text-[var(--mute)]',
  },
};

const QUALITY_META: Record<
  NonNullable<PublicStation['qualityTone']>,
  { label: string; hint: string; className: string }
> = {
  OK: {
    label: 'Calidad OK',
    hint: 'Sin alertas de calidad',
    className: 'border-[var(--ok,#1a7a3c)] text-[var(--ok,#1a7a3c)]',
  },
  ALERTA: {
    label: 'Revisar calidad',
    hint: 'Hay una señal para revisar',
    className: 'border-[var(--warn,#c47a00)] text-[var(--warn,#c47a00)]',
  },
  RECHAZADO: {
    label: 'Calidad no apta',
    hint: 'No se recomienda cargar aquí',
    className: 'border-[var(--alarm)] text-[var(--alarm)]',
  },
  SIN_DATO: {
    label: 'Calidad sin dato',
    hint: 'Todavía no hay informe',
    className: 'border-[var(--mute)] text-[var(--mute)]',
  },
};

function qualityOf(station: PublicStation) {
  const tone = station.qualityTone ?? 'SIN_DATO';
  return QUALITY_META[tone];
}

function StationDetail({
  station,
  onClose,
}: {
  station: PublicStation;
  onClose: () => void;
}) {
  const titleId = useId();
  const avail = AVAIL_META[station.availability];
  const quality = qualityOf(station);
  const updated = station.lastInventoryAt
    ? new Date(station.lastInventoryAt).toLocaleString('es-BO', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : null;

  return (
    <aside
      className="fc-sheet sticky top-4 space-y-5 border-2 border-[var(--ink)]"
      aria-labelledby={titleId}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="font-display text-2xl font-black leading-tight">
            {station.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--mute)]">
            {[station.city, station.municipality, station.address]
              .filter(Boolean)
              .join(' · ') || 'Bolivia'}
          </p>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-[var(--rail)]/60 p-3">
          <p className="text-xs text-[var(--mute)]">Cantidad</p>
          <p className={`mt-1 font-display text-xl font-black ${avail.text}`}>
            {avail.label}
          </p>
          {station.stockLiters != null ? (
            <p className="mt-2 font-display text-2xl font-black tabular-nums">
              {station.stockLiters.toLocaleString('es-BO')}{' '}
              <span className="text-base font-bold text-[var(--mute)]">L</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--mute)]">{avail.hint}</p>
          )}
          {station.fillPercent != null && (
            <div className="mt-3">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-[var(--mute)]">Nivel del tanque</span>
                <span className="font-semibold tabular-nums">
                  {station.fillPercent}%
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full border border-[var(--ink)] bg-[var(--haze,#e8ebe6)]">
                <div
                  className={`h-full ${AVAIL_META[station.availability].dot}`}
                  style={{
                    width: `${Math.min(100, Math.max(0, station.fillPercent))}%`,
                  }}
                />
              </div>
              {station.capacityLiters != null && (
                <p className="mt-1 text-xs text-[var(--mute)]">
                  de {station.capacityLiters.toLocaleString('es-BO')} L de
                  capacidad
                </p>
              )}
            </div>
          )}
        </div>
        <div className="border border-[var(--rail)]/60 p-3">
          <p className="text-xs text-[var(--mute)]">Calidad</p>
          <p
            className={`mt-1 font-display text-xl font-black ${
              station.qualityTone === 'OK'
                ? 'text-[var(--ok,#1a7a3c)]'
                : station.qualityTone === 'ALERTA'
                  ? 'text-[var(--warn,#c47a00)]'
                  : station.qualityTone === 'RECHAZADO'
                    ? 'text-[var(--alarm)]'
                    : 'text-[var(--mute)]'
            }`}
          >
            {station.qualityLabel ?? quality.label}
          </p>
          <p className="mt-1 text-xs text-[var(--mute)]">{quality.hint}</p>
        </div>
      </div>

      {station.products.length > 0 && (
        <div>
          <p className="text-xs text-[var(--mute)]">Productos</p>
          <p className="mt-1 text-sm font-medium">{station.products.join(' · ')}</p>
        </div>
      )}

      {updated && (
        <p className="text-xs text-[var(--mute)]">Actualizado {updated}</p>
      )}
    </aside>
  );
}

export function CbbaStationsExplorer({
  stations,
  departments,
}: {
  stations: PublicStation[];
  departments?: string[];
}) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'ok' | 'low' | 'quality'>(
    'all',
  );
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const deptOptions = useMemo(() => {
    if (departments?.length) return [...departments].sort((a, b) => a.localeCompare(b, 'es'));
    return [
      ...new Set(
        stations.map((s) => s.city).filter((c): c is string => Boolean(c)),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'));
  }, [departments, stations]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && stations.some((s) => s.code === hash)) {
      setSelectedCode(hash);
      return;
    }
    const preferred =
      stations.find((s) => s.code === 'ST-CBB-01') ?? stations[0];
    if (preferred) setSelectedCode(preferred.code);
  }, [stations]);

  function select(code: string) {
    setSelectedCode(code);
    window.history.replaceState(null, '', `#${code}`);
  }

  function clear() {
    setSelectedCode(null);
    window.history.replaceState(null, '', window.location.pathname);
  }

  const filtered = useMemo(() => {
    return stations.filter((s) => {
      if (deptFilter !== 'all' && s.city !== deptFilter) return false;
      if (stockFilter === 'ok') {
        if (s.availability !== 'FULL' && s.availability !== 'MEDIUM') {
          return false;
        }
      }
      if (stockFilter === 'low') {
        if (s.availability !== 'LOW' && s.availability !== 'EMPTY') {
          return false;
        }
      }
      if (stockFilter === 'quality') {
        if (s.qualityTone !== 'ALERTA' && s.qualityTone !== 'RECHAZADO') {
          return false;
        }
      }
      return true;
    });
  }, [stations, stockFilter, deptFilter]);

  const selected = stations.find((s) => s.code === selectedCode) ?? null;

  const counts = useMemo(() => {
    const base =
      deptFilter === 'all'
        ? stations
        : stations.filter((s) => s.city === deptFilter);
    let ok = 0;
    let low = 0;
    let qualityWarn = 0;
    for (const s of base) {
      if (s.availability === 'FULL' || s.availability === 'MEDIUM') ok += 1;
      if (s.availability === 'LOW' || s.availability === 'EMPTY') low += 1;
      if (s.qualityTone === 'ALERTA' || s.qualityTone === 'RECHAZADO') {
        qualityWarn += 1;
      }
    }
    return { ok, low, qualityWarn, total: base.length };
  }, [stations, deptFilter]);

  if (!stations.length) {
    return (
      <p className="text-sm text-[var(--mute)]">
        Todavía no hay surtidores para mostrar. Probá más tarde.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {deptOptions.length > 1 && (
        <nav
          className="flex flex-wrap gap-2"
          aria-label="Departamento"
        >
          <button
            type="button"
            onClick={() => setDeptFilter('all')}
            aria-pressed={deptFilter === 'all'}
            className={`border px-3 py-1.5 text-sm font-semibold ${
              deptFilter === 'all'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                : 'border-[var(--rail)]/60 hover:border-[var(--ink)]'
            }`}
          >
            Toda Bolivia
          </button>
          {deptOptions.map((d) => {
            const n = stations.filter((s) => s.city === d).length;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDeptFilter(d)}
                aria-pressed={deptFilter === d}
                className={`border px-3 py-1.5 text-sm ${
                  deptFilter === d
                    ? 'border-[var(--diesel)] bg-[var(--diesel-soft)] font-semibold'
                    : 'border-[var(--rail)]/60 hover:border-[var(--ink)]'
                }`}
              >
                {d}
                <span className="ml-1.5 text-xs text-[var(--mute)]">{n}</span>
              </button>
            );
          })}
        </nav>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={() => setStockFilter('all')}
          aria-pressed={stockFilter === 'all'}
          className={`border px-3 py-1.5 ${
            stockFilter === 'all'
              ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
              : 'border-[var(--rail)]/50'
          }`}
        >
          Todos · {counts.total}
        </button>
        <button
          type="button"
          onClick={() =>
            setStockFilter((f) => (f === 'ok' ? 'all' : 'ok'))
          }
          aria-pressed={stockFilter === 'ok'}
          className={`border px-3 py-1.5 ${
            stockFilter === 'ok'
              ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
              : 'border-[var(--rail)]/50'
          }`}
        >
          Con stock · {counts.ok}
        </button>
        <button
          type="button"
          onClick={() =>
            setStockFilter((f) => (f === 'low' ? 'all' : 'low'))
          }
          aria-pressed={stockFilter === 'low'}
          className={`border px-3 py-1.5 ${
            stockFilter === 'low'
              ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
              : 'border-[var(--rail)]/50'
          }`}
        >
          Poco o sin · {counts.low}
        </button>
        {counts.qualityWarn > 0 && (
          <button
            type="button"
            onClick={() =>
              setStockFilter((f) => (f === 'quality' ? 'all' : 'quality'))
            }
            aria-pressed={stockFilter === 'quality'}
            className={`border px-3 py-1.5 ${
              stockFilter === 'quality'
                ? 'border-[var(--warn,#c47a00)] bg-[var(--warn,#c47a00)] text-[var(--paper)]'
                : 'border-[var(--warn,#c47a00)] text-[var(--warn,#c47a00)]'
            }`}
          >
            Alerta calidad · {counts.qualityWarn}
          </button>
        )}
      </div>

      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--mute)]"
        aria-label="Leyenda del mapa"
      >
        <span className="font-semibold text-[var(--ink)]">Leyenda</span>
        {(
          [
            ['FULL', 'Hay'],
            ['MEDIUM', 'Medio'],
            ['LOW', 'Poco'],
            ['EMPTY', 'Sin'],
          ] as const
        ).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${AVAIL_META[key].dot}`}
              aria-hidden
            />
            {label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <CbbaLeafletMap
          stations={filtered.length ? filtered : stations}
          selectedCode={selectedCode}
          onSelect={select}
        />
        {selected ? (
          <StationDetail station={selected} onClose={clear} />
        ) : (
          <aside className="flex items-center border border-dashed border-[var(--rail)] px-5 py-8 text-sm text-[var(--mute)]">
            Elegí un punto del mapa o un surtidor de la lista.
          </aside>
        )}
      </div>

      <ul className="divide-y divide-[var(--rail)]/40 border-t border-[var(--rail)]/40">
        {filtered.map((s) => {
          const active = s.code === selectedCode;
          const avail = AVAIL_META[s.availability];
          const quality = qualityOf(s);
          return (
            <li key={s.code}>
              <button
                type="button"
                id={s.code}
                onClick={() => select(s.code)}
                aria-pressed={active}
                className={`flex w-full flex-col gap-3 px-1 py-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  active ? 'bg-[var(--diesel-soft)]' : 'hover:bg-[var(--paper)]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${avail.dot}`}
                      aria-hidden
                    />
                    <span className="font-display text-lg font-bold leading-tight sm:text-xl">
                      {s.name}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--mute)]">
                    {[s.city, s.municipality].filter(Boolean).join(' · ') ||
                      'Bolivia'}
                    {s.address ? ` · ${s.address}` : ''}
                  </p>
                  {(s.stockLiters != null || s.fillPercent != null) && (
                    <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--ink)]">
                      {s.stockLiters != null && (
                        <>{s.stockLiters.toLocaleString('es-BO')} L</>
                      )}
                      {s.stockLiters != null && s.fillPercent != null && ' · '}
                      {s.fillPercent != null && <>{s.fillPercent}%</>}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span
                    className={`border px-2.5 py-1 text-xs font-semibold ${avail.text} border-current`}
                  >
                    {avail.label}
                  </span>
                  <span
                    className={`border px-2.5 py-1 text-xs font-semibold ${quality.className}`}
                  >
                    {s.qualityLabel ?? quality.label}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
        {!filtered.length && (
          <li className="py-6 text-sm text-[var(--mute)]">
            No hay surtidores con ese filtro.
          </li>
        )}
      </ul>
    </div>
  );
}
