'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
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
    label: '1 · Salida / carga depósito',
  },
  {
    value: 'ROUTE_WAYPOINT',
    label: '2 · Tramo en ruta (peaje / control)',
  },
  {
    value: 'ARRIVAL_STATION',
    label: '3 · Llegada a estación',
  },
] as const;

function kindLabel(kind: string) {
  return KINDS.find((k) => k.value === kind)?.label ?? kind;
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
        // Fallback DEMO Cochabamba centro si el usuario niega GPS
        setLat(-17.3895);
        setLng(-66.1568);
        setAccuracy(null);
        setGeoMsg(
          'Sin GPS del dispositivo — se usó ubicación DEMO (centro Cochabamba).',
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
          latitude = -17.3895;
          longitude = -66.1568;
          setGeoMsg(
            'Sin GPS — se usó ubicación DEMO (centro Cochabamba).',
          );
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
        <h1 className="font-display text-3xl font-black">Tramos GPS</h1>
        <p className="text-[var(--mute)]">
          Solo chofer, estación y ANH ven los checkpoints de ruta.
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
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">Ruta · checkpoints DEMO</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight">
          Tramos con ubicación
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          El logger/cisterna guarda cantidad y calidad; el chofer registra el
          tramo con GPS del celular (salida, control en ruta, llegada). {note}
        </p>
        {user.cisternCode && (
          <p className="mt-2 text-sm">
            Cisterna sesión: <strong>{user.cisternCode}</strong>
          </p>
        )}
      </header>

      {canWrite && (
        <section className="fc-sheet space-y-4">
          <h2 className="font-display text-xl font-bold">Registrar tramo</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              Tipo de tramo
              <select
                className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              Etiqueta
              <input
                className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Litros (logger)
              <input
                className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Densidad
              <input
                className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Temperatura °C
              <input
                className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
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
              className="border-2 border-[var(--ink)] px-3 py-2 font-semibold"
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
          {geoMsg && <p className="text-sm text-[var(--mute)]">{geoMsg}</p>}
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="bg-[var(--diesel)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
          >
            {pending ? 'Guardando…' : 'Subir tramo al sistema'}
          </button>
          {log && <p className="text-sm">{log}</p>}
        </section>
      )}

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      <section>
        <h2 className="font-display text-xl font-bold">Historial</h2>
        {rows.length === 0 ? (
          <p className="mt-2 text-[var(--mute)]">Sin tramos aún.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
            {rows.map((r) => (
              <li key={r.id} className="space-y-2 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold">{kindLabel(r.kind)}</p>
                    <p className="text-[var(--mute)]">
                      {r.label ?? '—'} · {r.cistern.code} ·{' '}
                      <span className="fc-batch-code text-[var(--diesel)]">
                        {r.batch.batchCode}
                      </span>
                    </p>
                  </div>
                  <time className="text-xs text-[var(--mute)]">
                    {new Date(r.capturedAt).toLocaleString('es-BO')}
                  </time>
                </div>
                <p className="tabular-nums">
                  {Math.round(Number(r.volumeLiters)).toLocaleString('es-BO')} L
                  {r.density != null ? ` · d=${r.density}` : ''}
                  {r.temperature != null ? ` · ${r.temperature}°C` : ''}
                  {r.waterDetected ? ' · agua' : ''}
                </p>
                <p className="text-[var(--mute)]">
                  GPS {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                  {r.delivery?.station
                    ? ` · destino ${r.delivery.station.code}`
                    : ''}
                </p>
                <a
                  className="text-xs text-[var(--diesel)] underline"
                  href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=14/${r.latitude}/${r.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en mapa
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
