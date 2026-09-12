'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { QrScanButton } from '@/components/qr-scan-button';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { canAcceptCustody, homeForRole } from '@/lib/role-access';
import { checkpointKindLabel, labelEs, roleLabel } from '@/lib/es-labels';
import { rememberStationScan } from '@/lib/station-scan-history';
import {
  ContextPanel,
  JourneyStepper,
  OpsPageHeader,
  SpecGrid,
  StatusPill,
  TraceTimeline,
} from '@/components/ops';

type VolumeDrop = {
  deltaLiters: number;
  previousLiters: number;
  nextLiters: number;
  fromLabel: string;
  toLabel: string;
  fromAt: string;
  toAt: string;
  latitude: number;
  longitude: number;
  hoursBetween: number;
  note: string;
};

type QualityChange = {
  metric: 'density' | 'temperature' | 'water';
  previousValue: number | boolean | null;
  nextValue: number | boolean | null;
  delta: number | null;
  fromLabel: string;
  toLabel: string;
  fromAt: string;
  toAt: string;
  latitude: number;
  longitude: number;
  hoursBetween: number;
  note: string;
};

type Checkpoint = {
  id: string;
  kind: string;
  label: string | null;
  volumeLiters: string;
  density: string | null;
  temperature: string | null;
  waterDetected: boolean;
  latitude: number;
  longitude: number;
  capturedAt: string;
  note: string | null;
};

type CisternPayload = {
  data: {
    cistern: {
      code: string;
      qrToken: string;
      deviceId: string;
      plate: string | null;
      status: string;
      currentLoadLiters: string;
      deepLinkPath: string;
      driver: { name: string } | null;
      currentBatch: { batchCode: string; product: string } | null;
    };
    delivery: {
      id: string;
      status: string;
      loadedLiters: string;
      batch: { batchCode: string; product: string };
      station: { code: string; name: string };
    } | null;
    journey: {
      checkpoints: Checkpoint[];
      volumeDrops: VolumeDrop[];
      qualityChanges: QualityChange[];
      sampleCount: number;
    };
  };
  note?: string;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-BO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function CisternQrInner() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, ready, authHeaders } = useAuth();
  const [payload, setPayload] = useState<CisternPayload['data'] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canAccept = canAcceptCustody(user?.role);

  const here = `${pathname}?${searchParams.toString()}`.replace(/\?$/, '');
  const loginHref = `/login?next=${encodeURIComponent(here)}`;

  async function load() {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/c/${encodeURIComponent(token)}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw await errorFromResponse(res);
      const json = (await res.json()) as CisternPayload;
      setPayload(json.data);
      setNote(json.note ?? null);
      if (user?.role === 'STATION_STAFF' && json.data?.cistern) {
        rememberStationScan({
          token: json.data.cistern.qrToken || token,
          path: `/c/${json.data.cistern.qrToken || token}`,
          cisternCode: json.data.cistern.code,
          deviceId: json.data.cistern.deviceId,
          batchCode:
            json.data.delivery?.batch.batchCode ??
            json.data.cistern.currentBatch?.batchCode ??
            null,
          product:
            json.data.delivery?.batch.product ??
            json.data.cistern.currentBatch?.product ??
            null,
          status: json.data.delivery?.status ?? json.data.cistern.status,
        });
      }
    } catch (e) {
      setError(friendlyError(e));
      setPayload(null);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  function scanUpload() {
    if (!user) return;
    startTransition(async () => {
      setMsg(null);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/c/${encodeURIComponent(token)}/scan`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders(),
            },
            body: JSON.stringify({}),
          },
        );
        if (!res.ok) throw await errorFromResponse(res);
        const json = (await res.json()) as {
          note?: string;
          data: CisternPayload['data'] & {
            ingest?: { inserted: number };
            journey: CisternPayload['data']['journey'];
          };
        };
        setMsg(
          json.note ??
            `Camino sincronizado (${json.data.ingest?.inserted ?? 0} puntos nuevos).`,
        );
        await load();
      } catch (e) {
        setError(friendlyError(e));
      }
    });
  }

  function confirmReceive() {
    if (!user || !canAccept) return;
    startTransition(async () => {
      setMsg(null);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/c/${encodeURIComponent(token)}/receive`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders(),
            },
            body: JSON.stringify({}),
          },
        );
        if (!res.ok) throw await errorFromResponse(res);
        const json = (await res.json()) as { note?: string };
        setMsg(json.note ?? 'Recepción confirmada.');
        await load();
      } catch (e) {
        setError(friendlyError(e));
      }
    });
  }

  const drops = payload?.journey.volumeDrops ?? [];
  const qualityChanges = payload?.journey.qualityChanges ?? [];
  const checkpoints = payload?.journey.checkpoints ?? [];
  const kinds = new Set(checkpoints.map((c) => c.kind));
  const delivered = payload?.delivery?.status === 'DELIVERED';

  return (
    <main className="fc-page mx-auto max-w-3xl">
      <OpsPageHeader
        stamp="Estación · QR de cisterna"
        title={payload?.cistern.code ?? token}
        lede={note}
        actions={
          <>
            <QrScanButton />
            {user?.role === 'STATION_STAFF' && (
              <Link href="/escanear" className="fc-btn fc-btn-ghost !text-xs">
                Historial escaneos
              </Link>
            )}
          </>
        }
      />

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}
      {msg && (
        <p className="border border-[var(--seal)] bg-[var(--seal-soft)] px-3 py-2 text-sm text-[var(--seal)]">
          {msg}
        </p>
      )}

      {payload && (
        <ContextPanel
          code={payload.cistern.deviceId}
          title={payload.cistern.code}
          subtitle={
            payload.delivery
              ? `${payload.delivery.station.code} · ${payload.delivery.station.name}`
              : 'Sin entrega activa'
          }
          actions={
            payload.delivery ? (
              <StatusPill
                label={labelEs(payload.delivery.status)}
                tone={delivered ? 'ok' : 'warn'}
                pulse={!delivered}
              />
            ) : (
              <StatusPill label={labelEs(payload.cistern.status)} tone="mute" />
            )
          }
        >
          <SpecGrid
            items={[
              {
                label: 'Dispositivo',
                value: (
                  <span className="font-mono text-xs">
                    {payload.cistern.deviceId}
                  </span>
                ),
              },
              {
                label: 'QR token',
                value: (
                  <span className="font-mono text-xs">
                    {payload.cistern.qrToken}
                  </span>
                ),
              },
              { label: 'Placa', value: payload.cistern.plate ?? '—' },
              {
                label: 'Carga actual',
                value: `${payload.cistern.currentLoadLiters} L`,
              },
              {
                label: 'Chofer',
                value: payload.cistern.driver?.name ?? '—',
              },
              {
                label: 'Lote',
                value: (
                  <span className="fc-batch-code">
                    {payload.delivery?.batch.batchCode ??
                      payload.cistern.currentBatch?.batchCode ??
                      '—'}
                  </span>
                ),
              },
            ]}
          />

          {checkpoints.length > 0 && (
            <div className="pt-2">
              <p className="mb-3 fc-meta uppercase tracking-wide">
                Progreso del viaje
              </p>
              <JourneyStepper
                steps={[
                  {
                    id: 'LOAD_DEPARTURE',
                    label: 'Salida',
                    done: kinds.has('LOAD_DEPARTURE'),
                  },
                  {
                    id: 'ROUTE_WAYPOINT',
                    label: 'En ruta',
                    done: kinds.has('ROUTE_WAYPOINT'),
                  },
                  {
                    id: 'ARRIVAL_STATION',
                    label: 'Llegada',
                    done: kinds.has('ARRIVAL_STATION'),
                  },
                ]}
              />
            </div>
          )}

          {!user && ready && (
            <div className="space-y-2 border-t border-[var(--rail)]/40 pt-4">
              <p className="text-sm text-[var(--mute)]">
                Entrá como estación para subir el camino del dispositivo y
                confirmar recepción.
              </p>
              <Link href={loginHref} className="fc-btn fc-btn-ink">
                Entrar como estación
              </Link>
            </div>
          )}

          {user && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--rail)]/40 pt-4">
              <button
                type="button"
                disabled={pending}
                onClick={scanUpload}
                className="fc-btn fc-btn-ink disabled:opacity-50"
              >
                {pending ? 'Subiendo…' : 'Escanear / subir camino'}
              </button>
              {canAccept && payload.delivery && (
                <button
                  type="button"
                  disabled={pending || delivered}
                  onClick={confirmReceive}
                  className="fc-btn fc-btn-ghost disabled:opacity-50"
                >
                  Confirmar recepción en tanque
                </button>
              )}
              {!canAccept && (
                <p className="w-full text-sm text-[var(--mute)]">
                  Rol {roleLabel(user.role)}: podés ver/sincronizar. Recepción =
                  estacion@.
                  <Link href={homeForRole(user.role)} className="ml-2 underline">
                    Ir a tu panel
                  </Link>
                </p>
              )}
            </div>
          )}
        </ContextPanel>
      )}

      {drops.length > 0 && (
        <section className="space-y-3">
          <h2 className="fc-section-title">Cambios de cantidad en ruta</h2>
          <p className="text-sm text-[var(--mute)]">
            Cada bajada/subida con hora y lugar (GPS del logger / celular).
          </p>
          <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
            {drops.map((d, i) => (
              <li
                key={`${d.fromAt}-${i}`}
                className="py-3 text-sm fc-ops-rise"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{d.note}</p>
                  <StatusPill
                    label={
                      d.deltaLiters < 0
                        ? `${d.deltaLiters} L`
                        : `+${d.deltaLiters} L`
                    }
                    tone={d.deltaLiters < 0 ? 'danger' : 'ok'}
                  />
                </div>
                <p className="mt-1 text-[var(--mute)]">
                  {formatWhen(d.fromAt)} → {formatWhen(d.toAt)} (
                  {d.hoursBetween} h)
                </p>
                <p className="tabular-nums text-[var(--mute)]">
                  {d.previousLiters} L → {d.nextLiters} L · GPS{' '}
                  {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                </p>
                <a
                  className="text-xs underline"
                  href={`https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}#map=14/${d.latitude}/${d.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en mapa
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {qualityChanges.length > 0 && (
        <section className="space-y-3">
          <h2 className="fc-section-title">Cambios de calidad en ruta</h2>
          <p className="text-sm text-[var(--mute)]">
            Densidad, temperatura y agua — con la misma hora y lugar que el
            tramo.
          </p>
          <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
            {qualityChanges.map((q, i) => (
              <li
                key={`${q.metric}-${q.fromAt}-${i}`}
                className="py-3 text-sm fc-ops-rise"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{q.note}</p>
                  <StatusPill label={q.metric} tone="warn" />
                </div>
                <p className="mt-1 text-[var(--mute)]">
                  {formatWhen(q.fromAt)} → {formatWhen(q.toAt)} (
                  {q.hoursBetween} h)
                </p>
                <p className="tabular-nums text-[var(--mute)]">
                  GPS {q.latitude.toFixed(4)}, {q.longitude.toFixed(4)}
                </p>
                <a
                  className="text-xs underline"
                  href={`https://www.openstreetmap.org/?mlat=${q.latitude}&mlon=${q.longitude}#map=14/${q.latitude}/${q.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en mapa
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {checkpoints.length > 0 && (
        <section className="space-y-3">
          <h2 className="fc-section-title">Historial del camino</h2>
          <TraceTimeline
            steps={checkpoints.map((c) => ({
              id: c.id,
              title: c.label || checkpointKindLabel(c.kind),
              meta: `${c.volumeLiters} L · dens ${c.density ?? '—'} · ${c.temperature ?? '—'} °C`,
              detail: `GPS ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}${c.note ? ` · ${c.note}` : ''}`,
              at: formatWhen(c.capturedAt),
              alert: c.waterDetected,
            }))}
          />
        </section>
      )}

      <p className="text-xs text-[var(--mute)]">
        El QR va pegado a la cisterna y apunta al dispositivo{' '}
        <span className="font-mono">{payload?.cistern.deviceId ?? 'GW-…'}</span>.
        No es un bastón de un solo uso.
      </p>
    </main>
  );
}

export default function CisternQrPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Cargando cisterna…</p>}>
      <CisternQrInner />
    </Suspense>
  );
}
