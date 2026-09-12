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
import { labelEs, checkpointKindLabel } from '@/lib/es-labels';
import {
  ContextPanel,
  DataPair,
  FillGauge,
  MetricRail,
  OpsBoard,
  OpsSignalRow,
  StatusPill,
  TraceTimeline,
  qualityToneFrom,
  type StatusTone,
} from '@/components/ops';

function liters(n: number) {
  return `${Math.round(n).toLocaleString('es-BO')} L`;
}

function when(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
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
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [nameQuery, setNameQuery] = useState('');

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const q =
          mode === 'anh' && deptFilter !== 'all'
            ? `?city=${encodeURIComponent(deptFilter)}`
            : '?city=all';
        const res = await fetch(`${API_URL}/stations/supervision${q}`, {
          headers: authHeaders(),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as SupervisionResponse;
        if (!cancelled) {
          setData(json);
          if ((json.departments?.length ?? 0) > 0) {
            setAllDepartments((prev) =>
              (json.departments?.length ?? 0) >= prev.length
                ? (json.departments ?? [])
                : prev,
            );
          }
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
  }, [ready, user, authHeaders, mode, deptFilter]);

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

  const q = nameQuery.trim().toLowerCase();
  const filteredStations = !q
    ? data.data
    : data.data.filter((s) => {
        const hay = [
          s.name,
          s.code,
          s.city,
          s.municipality ?? '',
          s.address ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });

  const station =
    filteredStations.find((s) => s.code === selected) ??
    filteredStations[0] ??
    null;

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

  if (mode === 'anh') {
    return (
      <AnhControlRoom
        data={data}
        station={station}
        filteredStations={filteredStations}
        allDepartments={allDepartments}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        nameQuery={nameQuery}
        setNameQuery={setNameQuery}
        setSelected={setSelected}
      />
    );
  }

  return (
    <div className="fc-page">
      <header className="fc-page-header">
        <p className="fc-stamp text-[var(--mute)]">Estación · tu surtidor DEMO</p>
        <h1 className="fc-title fc-title-lg mt-2">Tanque y cisternas</h1>
        <p className="fc-lede">
          Controlás el combustible de tu EESS: estado del tanque y el camino de
          las cisternas que llegan aquí. Al recibir, escaneás el QR pegado en la
          cisterna: se sube solo el historial del dispositivo (litros, calidad,
          GPS). {data.note}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <p>
            Sesión: <strong>{user?.name}</strong>
            {user?.stationCode ? ` · ${user.stationCode}` : ''}.
          </p>
          <Link
            href="/c/CQ-CBB-01"
            className="font-semibold text-[var(--diesel)] underline"
          >
            Escanear QR cisterna DEMO (CIS-CBB-01)
          </Link>
          <Link
            href="/tramos"
            className="font-semibold text-[var(--diesel)] underline"
          >
            Ver tramos del viaje
          </Link>
          <Link
            href="/contratos"
            className="font-semibold text-[var(--diesel)] underline"
          >
            Contratos con choferes
          </Link>
        </div>
      </header>

      <MetricRail
        items={[
          {
            label: 'Stock actual',
            value: station
              ? `${Math.round(station.quantity.stockLiters).toLocaleString('es-BO')} L`
              : '—',
            tone:
              station &&
              station.quantity.fillPercent != null &&
              station.quantity.fillPercent < 25
                ? 'danger'
                : 'info',
          },
          {
            label: 'Llenado',
            value:
              station?.quantity.fillPercent != null
                ? `${station.quantity.fillPercent}%`
                : '—',
          },
          {
            label: 'Calidad',
            value: station?.quality.label ?? '—',
            tone: station
              ? qualityToneFrom(station.quality.tone)
              : 'mute',
          },
          {
            label: 'Entregas / en ruta',
            value: `${receivedCount} / ${inboundCount}`,
          },
        ]}
      />

      {station ? <StationDetail station={station} /> : null}
    </div>
  );
}

function AnhControlRoom({
  data,
  station,
  filteredStations,
  allDepartments,
  deptFilter,
  setDeptFilter,
  nameQuery,
  setNameQuery,
  setSelected,
}: {
  data: SupervisionResponse;
  station: SupervisionStation | null;
  filteredStations: SupervisionStation[];
  allDepartments: string[];
  deptFilter: string;
  setDeptFilter: (v: string) => void;
  nameQuery: string;
  setNameQuery: (v: string) => void;
  setSelected: (v: string) => void;
}) {
  const depts =
    allDepartments.length > 0 ? allDepartments : (data.departments ?? []);

  return (
    <div className="fc-page">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-[var(--ink)] pb-5">
        <div className="fc-page-header !max-w-xl">
          <p className="fc-stamp text-[var(--mute)]">
            ANH · centro de verificación DEMO
          </p>
          <h1 className="fc-title fc-title-lg mt-2">Red en monitoreo</h1>
          <p className="fc-lede">
            Cantidad, calidad y recorrido de cada cisterna. La decisión
            regulatoria sigue siendo humana. {data.note}
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-2"
          aria-label="Vistas de verificación"
        >
          <Link href="/tramos" className="fc-btn fc-btn-ghost !text-xs">
            Tramos GPS
          </Link>
          <Link href="/blockchain" className="fc-btn fc-btn-ghost !text-xs">
            Evidencia HSK
          </Link>
        </nav>
      </header>

      <MetricRail
        items={[
          {
            label: 'Surtidores',
            value: String(data.summary.stations),
            hint: deptFilter === 'all' ? 'Bolivia' : deptFilter,
          },
          {
            label: 'Stock bajo',
            value: String(data.summary.lowStock),
            tone: data.summary.lowStock > 0 ? 'warn' : 'ok',
            hint: data.summary.lowStock > 0 ? 'Revisar abastecimiento' : 'Sin presión',
          },
          {
            label: 'Alertas calidad',
            value: String(data.summary.qualityAlerts),
            tone: data.summary.qualityAlerts > 0 ? 'danger' : 'ok',
            hint:
              data.summary.qualityAlerts > 0
                ? 'Señal para inspección'
                : 'Sin alertas abiertas',
          },
          {
            label: 'Cisternas en ruta',
            value: String(data.summary.fleetCisterns),
            tone: data.summary.fleetCisterns > 0 ? 'info' : 'mute',
            hint: 'Flota activa',
          },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {depts.length > 1 ? (
          <nav className="flex flex-wrap gap-2" aria-label="Departamento">
            <button
              type="button"
              onClick={() => setDeptFilter('all')}
              aria-pressed={deptFilter === 'all'}
              className="fc-filter-chip"
            >
              Toda Bolivia
            </button>
            {depts.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDeptFilter(d)}
                aria-pressed={deptFilter === d}
                className={`fc-filter-chip ${
                  deptFilter === d ? 'fc-filter-chip-accent' : ''
                }`}
              >
                {d}
              </button>
            ))}
          </nav>
        ) : (
          <span />
        )}
        <label className="fc-label w-full max-w-sm">
          Filtrar surtidor
          <input
            type="search"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Nombre, código o municipio…"
            className="fc-field"
            autoComplete="off"
          />
        </label>
      </div>

      <OpsBoard
        className="fc-ops-scanline min-h-[28rem]"
        rail={
          <div className="flex max-h-[70vh] flex-col lg:max-h-[min(70vh,52rem)]">
            <div className="border-b border-[var(--ink)] px-3 py-2">
              <p className="font-display text-[0.65rem] font-bold uppercase tracking-wider text-[var(--mute)]">
                Señales · {filteredStations.length}
              </p>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {filteredStations.map((s) => {
                const active = s.code === station?.code;
                const tone = qualityToneFrom(s.quality.tone);
                return (
                  <li key={s.code}>
                    <OpsSignalRow
                      active={active}
                      title={s.name.replace(' (DEMO)', '')}
                      subtitle={
                        <>
                          {s.quantity.publicLevel}
                          {s.city ? ` · ${s.city}` : ''}
                        </>
                      }
                      onClick={() => setSelected(s.code)}
                      trailing={
                        <StatusPill
                          label={s.quality.label}
                          tone={tone}
                          pulse={tone === 'danger' || tone === 'warn'}
                        />
                      }
                    />
                  </li>
                );
              })}
              {filteredStations.length === 0 && (
                <li className="px-3 py-6 text-sm text-[var(--mute)]">
                  Ningún surtidor coincide con «{nameQuery.trim()}».
                </li>
              )}
            </ul>
          </div>
        }
        detail={
          station ? (
            <StationDetail station={station} anh />
          ) : (
            <p className="p-6 text-sm text-[var(--mute)]">
              Seleccioná un surtidor en la lista de señales.
            </p>
          )
        }
      />

      {data.fleetCisterns.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="fc-section-title">Flota en tránsito</h2>
            <StatusPill
              label={`${data.fleetCisterns.length} activas`}
              tone="info"
            />
          </div>
          <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
            {data.fleetCisterns.map((c) => (
              <li
                key={c.cisternCode ?? c.name}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-sm fc-ops-rise"
              >
                <div>
                  <p className="font-display font-bold">
                    {c.cisternCode ?? c.name}
                  </p>
                  <p className="text-[var(--mute)]">{c.location}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill label={labelEs(c.status)} tone="warn" />
                  <p className="tabular-nums font-semibold">
                    {liters(c.currentStockLiters)}
                    <span className="font-normal text-[var(--mute)]">
                      {' '}
                      / {liters(c.capacityLiters)}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StationDetail({
  station,
  anh = false,
}: {
  station: SupervisionStation;
  anh?: boolean;
}) {
  const qTone = qualityToneFrom(station.quality.tone);
  const inbound = station.cisterns.filter(
    (c) =>
      (c.status === 'IN_TRANSIT' ||
        c.status === 'LOADED' ||
        c.status === 'ACTIVE') &&
      !c.consumedAt,
  );
  const received = station.cisterns.filter(
    (c) =>
      c.status === 'DELIVERED' ||
      c.status === 'CONSUMED' ||
      Boolean(c.consumedAt),
  );

  const body = (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <DataPair label="Cantidad">
          <p className="font-display text-3xl font-black tabular-nums leading-none">
            {liters(station.quantity.stockLiters)}
          </p>
          <p className="mt-1 text-sm text-[var(--mute)]">
            de {liters(station.quantity.capacityLiters)} ·{' '}
            {station.quantity.publicLevel}
          </p>
          {station.quantity.fillPercent != null && (
            <FillGauge
              className="mt-3"
              percent={station.quantity.fillPercent}
              label="Nivel del tanque"
            />
          )}
        </DataPair>
        <DataPair label="Calidad">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`font-display text-3xl font-black leading-none ${
                qTone === 'ok'
                  ? 'text-[var(--seal)]'
                  : qTone === 'warn'
                    ? 'text-[var(--diesel)]'
                    : qTone === 'danger'
                      ? 'text-[var(--alarm)]'
                      : 'text-[var(--mute)]'
              }`}
            >
              {station.quality.label}
            </p>
            <StatusPill
              label={station.quality.tone}
              tone={qTone}
              pulse={qTone === 'danger' || qTone === 'warn'}
            />
          </div>
          <p className="mt-2 text-sm text-[var(--mute)]">
            {station.quality.summary}
          </p>
          {station.quality.batchCode && (
            <Link
              href={`/batches/${station.quality.batchCode}`}
              className="mt-2 inline-block text-sm font-semibold text-[var(--diesel)] underline"
            >
              Lote {station.quality.batchCode}
            </Link>
          )}
        </DataPair>
      </div>

      {anh && (
        <div className="flex flex-wrap gap-2 border-y border-[var(--rail)]/40 py-3">
          <StatusPill
            label={`${inbound.length} en ruta`}
            tone={inbound.length ? 'warn' : 'mute'}
          />
          <StatusPill
            label={`${received.length} recibidas`}
            tone={received.length ? 'ok' : 'mute'}
          />
          <StatusPill
            label={`${station.tanks.length} tanques`}
            tone="info"
          />
        </div>
      )}

      <section>
        <h3 className="fc-section-title">Tanques</h3>
        <ul className="mt-3 divide-y divide-[var(--rail)]/40">
          {station.tanks.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
            >
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-[var(--mute)]">
                  {labelEs(t.status)}
                  {t.cisternCode ? ` · ${t.cisternCode}` : ''}
                </p>
                {t.lastMeasurement && (
                  <p className="mt-1 text-xs text-[var(--mute)]">
                    Última medición: {liters(t.lastMeasurement.volumeLiters)}
                    {t.lastMeasurement.temperature != null
                      ? ` · ${t.lastMeasurement.temperature.toFixed(1)}°C`
                      : ''}
                    {t.lastMeasurement.waterDetected
                      ? ' · agua detectada'
                      : ''}
                  </p>
                )}
                {t.fillPercent != null && (
                  <FillGauge className="mt-2 max-w-xs" percent={t.fillPercent} />
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
        <h3 className="fc-section-title">Cisternas · trazabilidad</h3>
        {station.cisterns.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--mute)]">
            Sin entregas registradas.
          </p>
        ) : (
          <ul className="mt-4 space-y-5">
            {station.cisterns.map((c) => {
              const open =
                (c.status === 'IN_TRANSIT' ||
                  c.status === 'LOADED' ||
                  c.status === 'ACTIVE') &&
                !c.consumedAt;
              const tone: StatusTone = open
                ? 'warn'
                : c.status === 'DELIVERED' || c.status === 'CONSUMED'
                  ? 'ok'
                  : 'mute';
              const steps =
                c.checkpoints?.map((cp) => ({
                  id: cp.id,
                  title: checkpointKindLabel(cp.kind),
                  meta: `${liters(cp.volumeLiters)}${cp.label ? ` · ${cp.label}` : ''}`,
                  detail: `GPS ${cp.latitude.toFixed(3)}, ${cp.longitude.toFixed(3)}`,
                  at: when(cp.capturedAt),
                  alert: cp.waterDetected,
                })) ?? [];

              return (
                <li
                  key={c.tokenId}
                  className="border-t border-[var(--rail)]/45 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base font-bold">
                          {c.cisternCode ?? 'Sin código'}
                        </p>
                        <StatusPill
                          label={labelEs(c.status)}
                          tone={tone}
                          pulse={open}
                        />
                      </div>
                      <p className="mt-1 text-sm text-[var(--mute)]">
                        {c.product} ·{' '}
                        <Link
                          href={`/batches/${c.batchCode}`}
                          className="text-[var(--diesel)] underline"
                        >
                          {c.batchCode}
                        </Link>{' '}
                        · calidad {labelEs(c.batchQualityStatus)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--mute)]">
                        {c.consumedAt
                          ? `Recibida ${when(c.consumedAt)}`
                          : `Emitida ${when(c.issuedAt)}`}
                      </p>
                    </div>
                    <p className="font-display text-xl font-black tabular-nums">
                      {liters(c.volumeLiters)}
                    </p>
                  </div>
                  {steps.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 fc-meta uppercase tracking-wide">
                        Camino registrado
                      </p>
                      <TraceTimeline steps={steps} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );

  if (anh) {
    return (
      <ContextPanel
        code={station.code}
        title={station.name.replace(' (DEMO)', '')}
        subtitle={[station.city, station.municipality, station.address]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <Link href="/tramos" className="fc-btn fc-btn-ghost !text-xs">
            Ver tramos
          </Link>
        }
      >
        {body}
      </ContextPanel>
    );
  }

  return (
    <article className="space-y-6 border-2 border-[var(--ink)] p-5 md:p-6">
      <div>
        <p className="fc-stamp text-[var(--mute)]">{station.code}</p>
        <h2 className="mt-1 font-display text-2xl font-black">{station.name}</h2>
        <p className="mt-1 text-sm text-[var(--mute)]">
          {[station.city, station.municipality].filter(Boolean).join(' · ')}
          {station.address ? ` · ${station.address}` : ''}
        </p>
      </div>
      {body}
    </article>
  );
}
