'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import {
  canReadCheckpoint,
  canWriteCheckpoint,
  homeForRole,
} from '@/lib/role-access';

type CheckpointRow = {
  id: string;
  kind: string;
  label: string | null;
  volumeLiters: string | number;
  density: string | number | null;
  temperature: string | number | null;
  waterDetected: boolean;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
  note: string | null;
  batch: { batchCode: string; product: string };
  cistern: { code: string; plate: string | null };
  delivery: {
    id: string;
    status: string;
    station: { code: string; name: string };
  } | null;
  actor?: { name: string; role: string } | null;
};

const KINDS = [
  {
    value: 'LOAD_DEPARTURE',
    short: 'Salida',
    label: 'Salida / carga',
    step: 1,
  },
  {
    value: 'ROUTE_WAYPOINT',
    short: 'En ruta',
    label: 'Control en ruta',
    step: 2,
  },
  {
    value: 'ARRIVAL_STATION',
    short: 'Llegada',
    label: 'Llegada a estación',
    step: 3,
  },
] as const;

function kindMeta(kind: string) {
  return KINDS.find((k) => k.value === kind);
}

function liters(v: string | number) {
  return Math.round(Number(v)).toLocaleString('es-BO');
}

function when(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

type JourneyGroup = {
  key: string;
  deliveryId: string | null;
  cisternCode: string;
  cisternPlate: string | null;
  stationCode: string;
  stationName: string;
  batchCode: string;
  product: string;
  status: string | null;
  rows: CheckpointRow[];
};

/** Un viaje = una cisterna (entrega). No mezclar camiones en el mismo bloque. */
function groupByJourney(rows: CheckpointRow[]): JourneyGroup[] {
  const map = new Map<string, JourneyGroup>();
  for (const r of rows) {
    const deliveryId = r.delivery?.id ?? null;
    const stationCode = r.delivery?.station.code ?? 'SIN-DESTINO';
    const stationName =
      r.delivery?.station.name ?? 'Sin estación destino';
    const key = deliveryId
      ? `del:${deliveryId}`
      : `cis:${r.cistern.code}|st:${stationCode}|b:${r.batch.batchCode}`;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        deliveryId,
        cisternCode: r.cistern.code,
        cisternPlate: r.cistern.plate,
        stationCode,
        stationName,
        batchCode: r.batch.batchCode,
        product: r.batch.product,
        status: r.delivery?.status ?? null,
        rows: [],
      };
      map.set(key, g);
    }
    g.rows.push(r);
  }
  for (const g of map.values()) {
    g.rows.sort(
      (a, b) =>
        new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
    );
  }
  return [...map.values()].sort((a, b) => {
    const ta = new Date(a.rows[a.rows.length - 1]?.capturedAt ?? 0).getTime();
    const tb = new Date(b.rows[b.rows.length - 1]?.capturedAt ?? 0).getTime();
    return tb - ta;
  });
}

function JourneyProgress({ rows }: { rows: CheckpointRow[] }) {
  const kinds = new Set(rows.map((r) => r.kind));
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Progreso del viaje">
      {KINDS.map((k, i) => {
        const done = kinds.has(k.value);
        return (
          <li key={k.value} className="relative text-center">
            {i < KINDS.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[calc(50%+14px)] right-[-50%] top-3 h-0.5 ${
                  done ? 'bg-[var(--diesel)]' : 'bg-[var(--rail)]/50'
                }`}
              />
            )}
            <span
              className={`relative z-[1] mx-auto flex h-6 w-6 items-center justify-center border-2 text-xs font-bold ${
                done
                  ? 'border-[var(--diesel)] bg-[var(--diesel)] text-[var(--paper)]'
                  : 'border-[var(--rail)] bg-[var(--paper)] text-[var(--mute)]'
              }`}
            >
              {k.step}
            </span>
            <p
              className={`mt-2 text-xs font-semibold ${
                done ? 'text-[var(--ink)]' : 'text-[var(--mute)]'
              }`}
            >
              {k.short}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function VolumeChart({ rows }: { rows: CheckpointRow[] }) {
  const points = rows.slice(-8);
  const values = points.map((r) => Number(r.volumeLiters));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const chartH = 120;

  return (
    <div>
      <p className="text-xs text-[var(--mute)]">Litros en cada tramo</p>
      <div
        className="mt-3 flex items-end gap-2"
        style={{ height: chartH }}
        role="img"
        aria-label="Gráfico de litros por tramo"
      >
        {points.map((r) => {
          const v = Number(r.volumeLiters);
          const h = 24 + ((v - min) / span) * (chartH - 40);
          const meta = kindMeta(r.kind);
          return (
            <div
              key={r.id}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              style={{ height: chartH }}
            >
              <span className="text-[10px] font-semibold tabular-nums text-[var(--ink)]">
                {Math.round(v).toLocaleString('es-BO')}
              </span>
              <div
                className={`w-full max-w-10 ${
                  r.waterDetected
                    ? 'bg-[var(--alarm)]'
                    : 'bg-[var(--diesel)]'
                }`}
                style={{ height: h }}
                title={`${meta?.short ?? r.kind}: ${liters(v)} L`}
              />
              <span className="truncate text-[10px] text-[var(--mute)]">
                {meta?.short ?? '—'}
              </span>
            </div>
          );
        })}
      </div>
      {points.some((r) => r.waterDetected) && (
        <p className="mt-2 text-xs text-[var(--alarm)]">
          Barras rojas = agua detectada en ese tramo.
        </p>
      )}
    </div>
  );
}

function JourneyBlock({ group }: { group: JourneyGroup }) {
  const last = group.rows[group.rows.length - 1];
  const waterAlerts = group.rows.filter((r) => r.waterDetected).length;
  const stationLabel = group.stationName.replace(/\s*\(DEMO\)\s*/gi, ' ').trim();

  return (
    <section className="fc-sheet space-y-5 border-2 border-[var(--ink)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="fc-stamp text-[var(--mute)]">
            {group.cisternCode}
            {group.cisternPlate ? ` · ${group.cisternPlate}` : ''}
            {group.status ? ` · ${group.status}` : ''}
          </p>
          <h3 className="mt-1 font-display text-2xl font-black leading-tight">
            {group.cisternCode} → {stationLabel}
          </h3>
          <p className="mt-1 text-sm text-[var(--mute)]">
            Un viaje · {group.rows.length} tramo
            {group.rows.length === 1 ? '' : 's'} · lote{' '}
            <span className="fc-batch-code text-[var(--diesel)]">
              {group.batchCode}
            </span>{' '}
            · {group.product}
          </p>
          <p className="mt-0.5 text-xs text-[var(--mute)]">
            Destino {group.stationCode}
          </p>
        </div>
        {last && (
          <div className="text-right">
            <p className="text-xs text-[var(--mute)]">Último registro</p>
            <p className="font-display text-xl font-black tabular-nums">
              {liters(last.volumeLiters)} L
            </p>
            <p className="text-xs text-[var(--mute)]">{when(last.capturedAt)}</p>
          </div>
        )}
      </header>

      <JourneyProgress rows={group.rows} />

      <VolumeChart rows={group.rows} />

      {waterAlerts > 0 && (
        <p className="border border-[var(--alarm)] px-3 py-2 text-sm text-[var(--alarm)]">
          {waterAlerts} tramo{waterAlerts === 1 ? '' : 's'} con agua detectada.
        </p>
      )}

      <ol className="relative space-y-0 border-l-2 border-[var(--ink)] pl-5">
        {group.rows.map((r) => {
          const meta = kindMeta(r.kind);
          return (
            <li key={r.id} className="relative pb-5 last:pb-0">
              <span
                aria-hidden
                className={`absolute -left-[1.55rem] top-1 h-3 w-3 border-2 border-[var(--ink)] ${
                  r.waterDetected
                    ? 'bg-[var(--alarm)]'
                    : 'bg-[var(--diesel)]'
                }`}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-base font-bold">
                  {meta?.label ?? r.kind}
                  {r.label ? (
                    <span className="font-normal text-[var(--mute)]">
                      {' '}
                      · {r.label}
                    </span>
                  ) : null}
                </p>
                <time className="text-xs text-[var(--mute)]">
                  {when(r.capturedAt)}
                </time>
              </div>
              <p className="mt-1 text-sm tabular-nums">
                <strong>{liters(r.volumeLiters)} L</strong>
                {r.density != null ? ` · densidad ${r.density}` : ''}
                {r.temperature != null ? ` · ${r.temperature} °C` : ''}
                {r.waterDetected ? ' · agua detectada' : ''}
              </p>
              <p className="mt-0.5 text-xs text-[var(--mute)]">
                GPS {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                {r.accuracyMeters != null ? ` · ±${r.accuracyMeters} m` : ''}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function TramosPage() {
  const { user, ready, authHeaders } = useAuth();
  const canWrite = canWriteCheckpoint(user?.role);
  const canRead = canReadCheckpoint(user?.role);
  const [rows, setRows] = useState<CheckpointRow[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [cisternQuery, setCisternQuery] = useState('');
  const stationLocked =
    user?.role === 'STATION_STAFF' && Boolean(user.stationCode);

  useEffect(() => {
    if (stationLocked && user?.stationCode) {
      setStationFilter(user.stationCode);
    }
  }, [stationLocked, user?.stationCode]);

  const [kind, setKind] = useState<string>('ROUTE_WAYPOINT');
  const [label, setLabel] = useState('Control ruta DEMO');
  const [volume, setVolume] = useState('8000');
  const [density, setDensity] = useState('0.746');
  const [temperature, setTemperature] = useState('22.0');
  const [water, setWater] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  const groups = useMemo(() => groupByJourney(rows), [rows]);
  const stationOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups) {
      if (!map.has(g.stationCode)) {
        map.set(
          g.stationCode,
          g.stationName.replace(/\s*\(DEMO\)\s*/gi, ' ').trim(),
        );
      }
    }
    return [...map.entries()]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [groups]);
  const visibleGroups = useMemo(() => {
    const q = cisternQuery.trim().toUpperCase();
    return groups.filter((g) => {
      if (stationFilter !== 'all' && g.stationCode !== stationFilter) {
        return false;
      }
      if (!q) return true;
      return (
        g.cisternCode.toUpperCase().includes(q) ||
        (g.cisternPlate?.toUpperCase().includes(q) ?? false)
      );
    });
  }, [groups, stationFilter, cisternQuery]);
  const waterTotal = rows.filter((r) => r.waterDetected).length;

  useEffect(() => {
    if (
      stationFilter !== 'all' &&
      stationOptions.length > 0 &&
      !stationOptions.some((s) => s.code === stationFilter)
    ) {
      setStationFilter('all');
    }
  }, [stationOptions, stationFilter]);

  function loadList() {
    if (!user || !canRead) return;
    start(async () => {
      try {
        const res = await fetch(`${API_URL}/checkpoints`, {
          headers: authHeaders(),
          cache: 'no-store',
        });
        if (!res.ok) throw await errorFromResponse(res);
        const json = (await res.json()) as {
          note?: string;
          data: CheckpointRow[];
        };
        setRows(json.data);
        setNote(json.note ?? '');
        setError(null);
      } catch (e) {
        setError(friendlyError(e, 'No se pudieron cargar los tramos'));
      }
    });
  }

  useEffect(() => {
    if (!ready || !user || !canRead) return;
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.id, canRead]);

  function captureGps() {
    setGeoMsg(null);
    if (!navigator.geolocation) {
      setGeoMsg('Este navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(
          pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : null,
        );
        setGeoMsg('Ubicación capturada del celular.');
      },
      () => {
        setGeoMsg(
          'Sin GPS del dispositivo. Capturá de nuevo o ingresá lat/lng manualmente.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function submit() {
    if (!canWrite) return;
    start(async () => {
      setLog(null);
      try {
        let latitude = lat;
        let longitude = lng;
        let accuracyMeters = accuracy;
        if (latitude == null || longitude == null) {
          setLog(
            'Falta ubicación. Usá «Capturar GPS» o escribí latitud y longitud.',
          );
          return;
        }
        const clientEventId = `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const res = await fetch(`${API_URL}/checkpoints`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            kind,
            label,
            volumeLiters: Number(volume),
            density: Number(density),
            temperature: Number(temperature),
            waterDetected: water,
            latitude,
            longitude,
            accuracyMeters: accuracyMeters ?? undefined,
            clientEventId,
            note: 'Checkpoint DEMO desde celular',
            batchCode: 'FC-BO-2026-000182',
          }),
        });
        if (!res.ok) throw await errorFromResponse(res);
        setLog('Tramo registrado.');
        setShowForm(false);
        loadList();
      } catch (e) {
        setLog(friendlyError(e, 'No se pudo registrar el tramo'));
      }
    });
  }

  if (!ready) {
    return <p className="text-[var(--mute)]">Cargando…</p>;
  }

  if (!user || !canRead) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-black">Tramos del viaje</h1>
        <p className="text-[var(--mute)]">
          Solo chofer, estación y ANH ven la trazabilidad del camino (cantidad y
          calidad por tramo).
        </p>
        {user && (
          <Link href={homeForRole(user.role)} className="underline">
            Ir a tu panel
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="fc-page">
      <header className="fc-page-header">
        <p className="fc-stamp text-[var(--mute)]">
          Camino del combustible · cantidad y calidad
        </p>
        <h1 className="fc-title mt-2">
          Tramos del viaje
        </h1>
        <p className="fc-lede">
          Cada bloque es <strong>un viaje de una cisterna</strong> hacia una
          estación: salida → ruta → llegada, con litros y calidad en cada
          tramo. No se mezclan camiones distintos en el mismo camino.
        </p>
        {user.cisternCode && (
          <p className="mt-2 text-sm">
            Tu cisterna: <strong>{user.cisternCode}</strong>
          </p>
        )}
      </header>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="border border-[var(--rail)]/50 px-3 py-1.5">
          <strong className="tabular-nums">{groups.length}</strong> viaje
          {groups.length === 1 ? '' : 's'}
        </span>
        <span className="border border-[var(--rail)]/50 px-3 py-1.5">
          <strong className="tabular-nums">{rows.length}</strong> tramos
        </span>
        {waterTotal > 0 && (
          <span className="border border-[var(--alarm)] px-3 py-1.5 text-[var(--alarm)]">
            <strong className="tabular-nums">{waterTotal}</strong> con agua
          </span>
        )}
      </div>

      {stationOptions.length > 0 && !stationLocked && (
        <nav
          className="flex flex-wrap gap-2"
          aria-label="Filtrar por estación destino"
        >
          <button
            type="button"
            onClick={() => setStationFilter('all')}
            aria-pressed={stationFilter === 'all'}
            className={`border px-3 py-1.5 text-sm font-semibold ${
              stationFilter === 'all'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                : 'border-[var(--rail)]/60 hover:border-[var(--ink)]'
            }`}
          >
            Todos los viajes
          </button>
          {stationOptions.map((s) => {
            const count = groups.filter((g) => g.stationCode === s.code).length;
            return (
              <button
                key={s.code}
                type="button"
                onClick={() => setStationFilter(s.code)}
                aria-pressed={stationFilter === s.code}
                className={`border px-3 py-1.5 text-sm ${
                  stationFilter === s.code
                    ? 'border-[var(--diesel)] bg-[var(--diesel-soft)] font-semibold text-[var(--ink)]'
                    : 'border-[var(--rail)]/60 hover:border-[var(--ink)]'
                }`}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="ml-1.5 text-xs text-[var(--mute)]">
                  {count} viaje{count === 1 ? '' : 's'}
                </span>
              </button>
            );
          })}
        </nav>
      )}
      {stationLocked && user?.stationCode && (
        <p className="text-sm text-[var(--mute)]">
          Solo viajes con destino <strong>{user.stationCode}</strong> (tu EESS).
        </p>
      )}

      <label className="block max-w-md text-sm">
        Buscar cisterna
        <input
          type="search"
          value={cisternQuery}
          onChange={(e) => setCisternQuery(e.target.value)}
          placeholder="Ej. CIS-CBB-06"
          className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 font-mono uppercase"
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {canWrite && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="fc-btn fc-btn-ghost"
          >
            {showForm ? 'Ocultar registro' : 'Registrar tramo GPS'}
          </button>
          {showForm && (
            <section className="fc-sheet space-y-4">
              <h2 className="fc-section-title">Nuevo tramo</h2>
              <p className="fc-meta">
                1) Elegí el tipo · 2) Capturá GPS · 3) Subí al sistema
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="fc-label sm:col-span-2">
                  Tipo de tramo
                  <select
                    className="fc-field"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    {KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.step}. {k.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fc-label sm:col-span-2">
                  Etiqueta
                  <input
                    className="fc-field"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </label>
                <label className="fc-label">
                  Litros
                  <input
                    className="fc-field fc-num"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                  />
                </label>
                <label className="fc-label">
                  Densidad
                  <input
                    className="fc-field fc-num"
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                  />
                </label>
                <label className="fc-label">
                  Temperatura °C
                  <input
                    className="fc-field fc-num"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </label>
                <label className="mt-6 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={water}
                    onChange={(e) => setWater(e.target.checked)}
                  />
                  Agua detectada
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={captureGps}
                  className="fc-btn fc-btn-ghost"
                >
                  Capturar GPS
                </button>
                {lat != null && lng != null && (
                  <span className="tabular-nums text-[var(--mute)]">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                    {accuracy != null ? ` · ±${accuracy} m` : ''}
                  </span>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="fc-label">
                  Latitud (manual)
                  <input
                    className="fc-field fc-num"
                    value={lat ?? ''}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setLat(Number.isFinite(n) ? n : null);
                      setGeoMsg('Ubicación manual.');
                    }}
                    placeholder="-17.3895"
                  />
                </label>
                <label className="fc-label">
                  Longitud (manual)
                  <input
                    className="fc-field fc-num"
                    value={lng ?? ''}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setLng(Number.isFinite(n) ? n : null);
                      setGeoMsg('Ubicación manual.');
                    }}
                    placeholder="-66.1568"
                  />
                </label>
              </div>
              {geoMsg && <p className="text-sm text-[var(--mute)]">{geoMsg}</p>}
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="fc-btn"
              >
                {pending ? 'Guardando…' : 'Subir tramo'}
              </button>
              {log && <p className="text-sm">{log}</p>}
            </section>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      {visibleGroups.length === 0 ? (
        <p className="text-[var(--mute)]">
          {cisternQuery.trim()
            ? `No hay viajes con cisterna «${cisternQuery.trim()}».`
            : 'Todavía no hay tramos. El chofer registra salida, control en ruta y llegada.'}
        </p>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((g) => (
            <JourneyBlock key={g.key} group={g} />
          ))}
        </div>
      )}

      {note ? (
        <p className="text-xs text-[var(--mute)]">{note}</p>
      ) : null}
    </div>
  );
}
