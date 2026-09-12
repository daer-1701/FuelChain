'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { friendlyError } from '@/lib/api-error';
import type {
  SupervisionResponse,
  SupervisionStation,
} from '@/components/station-types';

const qualityClass: Record<SupervisionStation['quality']['tone'], string> = {
  OK: 'text-[var(--seal)]',
  ALERTA: 'text-[var(--diesel)]',
  RECHAZADO: 'text-[var(--alarm)]',
  SIN_DATO: 'text-[var(--mute)]',
};

function liters(n: number) {
  return `${Math.round(n).toLocaleString('es-BO')} L`;
}

export function SupervisionPanel({
  mode = 'anh',
}: {
  mode?: 'anh' | 'station';
}) {
  const { authHeaders, user, ready } = useAuth();
  const [data, setData] = useState<SupervisionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/stations/supervision`, {
          headers: authHeaders(),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as SupervisionResponse;
        if (!cancelled) {
          setData(json);
          const preferred =
            mode === 'station' && user.stationCode
              ? json.data.find((s) => s.code === user.stationCode)?.code
              : null;
          setSelected(preferred ?? json.data[0]?.code ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(friendlyError(e, 'Error de carga'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user, authHeaders, mode]);

  if (!ready) {
    return <p className="text-[var(--mute)]">Cargando sesión…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="text-[var(--alarm)]">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="text-[var(--mute)]">Cargando red de surtidores…</p>;
  }

  const station =
    data.data.find((s) => s.code === selected) ?? data.data[0] ?? null;

  const receivedCount =
    station?.cisterns.filter(
      (c) =>
        c.status === 'DELIVERED' ||
        c.status === 'CONSUMED' ||
        Boolean(c.consumedAt),
    ).length ?? 0;
  const inboundCount =
    station?.cisterns.filter(
      (c) =>
        (c.status === 'IN_TRANSIT' ||
          c.status === 'LOADED' ||
          c.status === 'ACTIVE') &&
        !c.consumedAt,
    ).length ?? 0;

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">
          {mode === 'anh'
            ? 'ANH · verificación de movimientos DEMO'
            : 'Estación · tu surtidor DEMO'}
        </p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">
          {mode === 'anh'
            ? 'Todos los movimientos'
            : 'Tanque y cisternas'}
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          {mode === 'anh'
            ? 'Verificás cantidad, calidad y cisternas en cada surtidor de la red. La decisión regulatoria sigue siendo humana.'
            : 'Controlás el combustible de tu EESS: estado del tanque y seguimiento de las cisternas que vienen o ya descargaron aquí. Recibís con el QR del chofer.'}{' '}
          {data.note}
        </p>
        {mode === 'station' && (
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <p>
              Sesión: <strong>{user?.name}</strong>
              {user?.stationCode ? ` · ${user.stationCode}` : ''}.
            </p>
            <Link
              href="/contratos"
              className="font-semibold text-[var(--diesel)] underline"
            >
              Ver contratos con choferes
            </Link>
            <Link
              href="/tramos"
              className="font-semibold text-[var(--diesel)] underline"
            >
              Ver tramos GPS
            </Link>
          </div>
        )}
      </header>

      {mode === 'anh' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Surtidores" value={String(data.summary.stations)} />
          <Stat
            label="Stock bajo"
            value={String(data.summary.lowStock)}
            warn={data.summary.lowStock > 0}
          />
          <Stat
            label="Alertas calidad"
            value={String(data.summary.qualityAlerts)}
            warn={data.summary.qualityAlerts > 0}
          />
          <Stat
            label="Cisternas en ruta"
            value={String(data.summary.fleetCisterns)}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Stock actual"
            value={
              station
                ? `${Math.round(station.quantity.stockLiters).toLocaleString('es-BO')} L`
                : '—'
            }
            warn={Boolean(
              station &&
                station.quantity.fillPercent != null &&
                station.quantity.fillPercent < 25,
            )}
          />
          <Stat
            label="Llenado"
            value={
              station?.quantity.fillPercent != null
                ? `${station.quantity.fillPercent}%`
                : '—'
            }
          />
          <Stat
            label="Calidad"
            value={station?.quality.label ?? '—'}
            warn={
              station?.quality.tone === 'ALERTA' ||
              station?.quality.tone === 'RECHAZADO'
            }
          />
          <Stat
            label="Entregas / en ruta"
            value={`${receivedCount} / ${inboundCount}`}
          />
        </div>
      )}

      <div className={`grid gap-6 ${data.data.length > 1 ? 'lg:grid-cols-[minmax(0,14rem)_1fr]' : ''}`}>
        {data.data.length > 1 && (
        <ul className="space-y-1 border-y-2 border-[var(--ink)] py-2 lg:max-h-[70vh] lg:overflow-y-auto">
          {data.data.map((s) => {
            const active = s.code === station?.code;
            return (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => setSelected(s.code)}
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-3 text-left ${
                    active
                      ? 'bg-[var(--diesel-soft)]'
                      : 'hover:bg-[var(--paper)]'
                  }`}
                >
                  <span className="font-display text-sm font-bold leading-tight">
                    {s.name.replace(' (DEMO)', '')}
                  </span>
                  <span className="text-xs text-[var(--mute)]">
                    {s.quantity.publicLevel} ·{' '}
                    <span className={qualityClass[s.quality.tone]}>
                      {s.quality.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        )}

        {station && (
          <article className="space-y-6 border-2 border-[var(--ink)] p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="fc-stamp text-[var(--mute)]">{station.code}</p>
                <h2 className="mt-1 font-display text-2xl font-black">
                  {station.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  {station.municipality}
                  {station.address ? ` · ${station.address}` : ''}
                </p>
              </div>
              {mode === 'anh' && (
                <Link
                  href={`/mapa#${station.code}`}
                  className="border border-[var(--ink)] px-3 py-1.5 text-xs font-semibold"
                >
                  Ver en mapa
                </Link>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-[var(--rail)]/50 p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--mute)]">
                  Cantidad actual
                </p>
                <p className="mt-2 font-display text-3xl font-black tabular-nums">
                  {liters(station.quantity.stockLiters)}
                </p>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  de {liters(station.quantity.capacityLiters)} ·{' '}
                  {station.quantity.fillPercent ?? '—'}% ·{' '}
                  {station.quantity.publicLevel}
                </p>
                {station.quantity.fillPercent != null && (
                  <div className="mt-3 h-2 w-full border border-[var(--ink)] bg-[var(--haze)]">
                    <div
                      className="h-full bg-[var(--diesel)]"
                      style={{
                        width: `${Math.min(100, station.quantity.fillPercent)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="border border-[var(--rail)]/50 p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--mute)]">
                  Calidad actual
                </p>
                <p
                  className={`mt-2 font-display text-3xl font-black ${qualityClass[station.quality.tone]}`}
                >
                  {station.quality.label}
                </p>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  {station.quality.summary}
                </p>
                {station.quality.batchCode && (
                  <Link
                    href={`/batches/${station.quality.batchCode}`}
                    className="mt-2 inline-block text-sm text-[var(--diesel)] underline"
                  >
                    Lote {station.quality.batchCode}
                  </Link>
                )}
              </div>
            </div>

            <section>
              <h3 className="font-display text-lg font-bold">Tanques</h3>
              <ul className="mt-3 divide-y divide-[var(--rail)]/40">
                {station.tanks.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-[var(--mute)]">
                        {t.status}
                        {t.cisternCode ? ` · ${t.cisternCode}` : ''}
                      </p>
                      {t.lastMeasurement && (
                        <p className="mt-1 text-xs text-[var(--mute)]">
                          Última medición:{' '}
                          {liters(t.lastMeasurement.volumeLiters)}
                          {t.lastMeasurement.temperature != null
                            ? ` · ${t.lastMeasurement.temperature.toFixed(1)}°C`
                            : ''}
                          {t.lastMeasurement.waterDetected
                            ? ' · agua detectada'
                            : ''}
                        </p>
                      )}
                    </div>
                    <p className="tabular-nums font-semibold">
                      {liters(t.currentStockLiters)}
                      <span className="block text-xs font-normal text-[var(--mute)]">
                        / {liters(t.capacityLiters)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-display text-lg font-bold">
                Cisternas (entregas)
              </h3>
              {station.cisterns.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--mute)]">
                  Sin entregas registradas.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--rail)]/40">
                  {station.cisterns.map((c) => (
                    <li
                      key={c.tokenId}
                      className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold">
                          {c.cisternCode ?? 'Sin código'} · {c.status}
                        </p>
                        <p className="text-[var(--mute)]">
                          {c.product} ·{' '}
                          <Link
                            href={`/batches/${c.batchCode}`}
                            className="text-[var(--diesel)] underline"
                          >
                            {c.batchCode}
                          </Link>{' '}
                          · calidad lote {c.batchQualityStatus}
                        </p>
                        <p className="mt-1 text-xs text-[var(--mute)]">
                          {c.consumedAt
                            ? `Recibida ${new Date(c.consumedAt).toLocaleString('es-BO')}`
                            : `Emitida ${new Date(c.issuedAt).toLocaleString('es-BO')}`}
                        </p>
                        {c.checkpoints && c.checkpoints.length > 0 && (
                          <ul className="mt-2 space-y-1 border-l border-[var(--rail)]/50 pl-3 text-xs text-[var(--mute)]">
                            {c.checkpoints.map((cp) => (
                              <li key={cp.id}>
                                {cp.kind.replaceAll('_', ' ')}
                                {cp.label ? ` · ${cp.label}` : ''} ·{' '}
                                {liters(cp.volumeLiters)} ·{' '}
                                {cp.latitude.toFixed(3)},{cp.longitude.toFixed(3)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <p className="tabular-nums font-semibold">
                        {liters(c.volumeLiters)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </article>
        )}
      </div>

      {mode === 'anh' && data.fleetCisterns.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">
            Flota de cisternas (en ruta)
          </h2>
          <ul className="mt-4 divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
            {data.fleetCisterns.map((c) => (
              <li
                key={c.cisternCode ?? c.name}
                className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
              >
                <div>
                  <p className="font-semibold">{c.cisternCode ?? c.name}</p>
                  <p className="text-[var(--mute)]">{c.location}</p>
                </div>
                <p className="tabular-nums">
                  {liters(c.currentStockLiters)} / {liters(c.capacityLiters)} ·{' '}
                  {c.status}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="border border-[var(--rail)]/50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mute)]">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-3xl font-black tabular-nums ${
          warn ? 'text-[var(--alarm)]' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
