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
  const isDriver =
    user?.role === 'TRANSPORTER' || user?.role === 'DEPOT_OPERATOR';
  const ownCistern =
    !isDriver ||
    !user?.cisternCode ||
    !payload?.cistern ||
    payload.cistern.code === user.cisternCode ||
    payload.cistern.qrToken === user.cisternCode;
  const forMyStation =
    user?.role !== 'STATION_STAFF' ||
    !user.stationCode ||
    !payload?.delivery ||
    payload.delivery.station.code === user.stationCode;

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
        const json = (await res.json()) as {
          note?: string;
          blockchain?: {
            status?: string;
            transactionHash?: string | null;
            explorerUrl?: string | null;
          } | null;
        };
        const chain = json.blockchain;
        const chainBit =
          chain?.transactionHash
            ? ` Evidencia HSK anclada.`
            : chain?.status
              ? ` Evidencia: ${chain.status}.`
              : '';
        setMsg((json.note ?? 'Recepción confirmada.') + chainBit);
        await load();
      } catch (e) {
        setError(friendlyError(e));
      }
    });
  }

  const drops = payload?.journey.volumeDrops ?? [];
  const qualityChanges = payload?.journey.qualityChanges ?? [];
  const checkpoints = payload?.journey.checkpoints ?? [];

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm text-[var(--mute)]">QR de cisterna (sticker)</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          {payload?.cistern.code ?? token}
        </h1>
        {note && <p className="text-sm text-[var(--mute)]">{note}</p>}
        <div className="flex flex-wrap items-center gap-3">
          {!isDriver && <QrScanButton />}
          {user?.role === 'STATION_STAFF' && (
            <Link
              href="/escanear"
              className="text-sm font-semibold text-[var(--diesel)] underline"
            >
              Volver al historial de escaneos
            </Link>
          )}
          {isDriver && (
            <Link
              href="/mi-qr"
              className="text-sm font-semibold text-[var(--diesel)] underline"
            >
              Volver a mi QR
            </Link>
          )}
        </div>
      </header>

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}
      {msg && <p className="text-sm text-[var(--seal)]">{msg}</p>}

      {payload && !ownCistern && (
        <section className="fc-sheet space-y-3">
          <p>
            Como chofer solo podés ver el QR de tu cisterna (
            <strong>{user?.cisternCode}</strong>).
          </p>
          <Link href="/mi-qr" className="fc-btn inline-block">
            Ir a mi QR
          </Link>
        </section>
      )}

      {payload && ownCistern && (
        <section className="fc-sheet space-y-3">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-[var(--mute)]">Dispositivo</dt>
            <dd className="font-mono text-xs">{payload.cistern.deviceId}</dd>
            <dt className="text-[var(--mute)]">QR token</dt>
            <dd className="font-mono text-xs">{payload.cistern.qrToken}</dd>
            <dt className="text-[var(--mute)]">Placa</dt>
            <dd>{payload.cistern.plate ?? '—'}</dd>
            <dt className="text-[var(--mute)]">Carga actual</dt>
            <dd className="tabular-nums">
              {payload.cistern.currentLoadLiters} L
            </dd>
            <dt className="text-[var(--mute)]">Chofer</dt>
            <dd>{payload.cistern.driver?.name ?? '—'}</dd>
            <dt className="text-[var(--mute)]">Lote</dt>
            <dd className="fc-batch-code">
              {payload.delivery?.batch.batchCode ??
                payload.cistern.currentBatch?.batchCode ??
                '—'}
            </dd>
            <dt className="text-[var(--mute)]">Destino</dt>
            <dd>
              {payload.delivery
                ? `${payload.delivery.station.code} · ${payload.delivery.station.name}`
                : '—'}
            </dd>
            <dt className="text-[var(--mute)]">Estado viaje</dt>
            <dd>{payload.delivery ? labelEs(payload.delivery.status) : '—'}</dd>
          </dl>

          {!user && ready && (
            <div className="space-y-2 border-t border-[var(--rail)]/40 pt-4">
              <p className="text-sm text-[var(--mute)]">
                Entrá como estación para subir el camino del dispositivo y
                confirmar recepción.
              </p>
              <Link
                href={loginHref}
                className="inline-block bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)]"
              >
                Entrar como estación
              </Link>
            </div>
          )}

          {user && !forMyStation && (
            <div className="space-y-2 border-t border-[var(--rail)]/40 pt-4">
              <p className="text-sm text-[var(--alarm)]">
                Este viaje va a {payload.delivery?.station.code}, no a tu EESS (
                {user.stationCode}). No podés confirmar recepción aquí.
              </p>
              <Link href="/escanear" className="fc-btn fc-btn-ink inline-block">
                Ver QR destinados a mi estación
              </Link>
            </div>
          )}

          {user && forMyStation && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--rail)]/40 pt-4">
              <button
                type="button"
                disabled={pending}
                onClick={scanUpload}
                className="bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
              >
                {pending ? 'Subiendo…' : 'Escanear / subir camino'}
              </button>
              {canAccept && payload.delivery && (
                <button
                  type="button"
                  disabled={pending || payload.delivery.status === 'DELIVERED'}
                  onClick={confirmReceive}
                  className="border-2 border-[var(--ink)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
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
        </section>
      )}

      {ownCistern && drops.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Cambios de cantidad en ruta</h2>
          <p className="text-sm text-[var(--mute)]">
            Cada bajada/subida con hora y lugar (GPS del logger / celular).
          </p>
          <ul className="space-y-3">
            {drops.map((d, i) => (
              <li
                key={`${d.fromAt}-${i}`}
                className="border border-[var(--rail)]/50 px-3 py-3 text-sm"
              >
                <p
                  className={
                    d.deltaLiters < 0
                      ? 'font-semibold text-[var(--alarm)]'
                      : 'font-semibold text-[var(--seal)]'
                  }
                >
                  {d.note}
                </p>
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

      {ownCistern && qualityChanges.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Cambios de calidad en ruta</h2>
          <p className="text-sm text-[var(--mute)]">
            Densidad, temperatura y agua — con la misma hora y lugar que el
            tramo.
          </p>
          <ul className="space-y-3">
            {qualityChanges.map((q, i) => (
              <li
                key={`${q.metric}-${q.fromAt}-${i}`}
                className="border border-[var(--rail)]/50 px-3 py-3 text-sm"
              >
                <p className="font-semibold text-[var(--diesel)]">{q.note}</p>
                <p className="mt-1 text-[var(--mute)]">
                  {formatWhen(q.fromAt)} → {formatWhen(q.toAt)} (
                  {q.hoursBetween} h) · {q.metric}
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

      {ownCistern && checkpoints.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Historial del camino</h2>
          <ol className="space-y-2">
            {checkpoints.map((c) => (
              <li
                key={c.id}
                className="border-l-2 border-[var(--diesel)] pl-3 text-sm"
              >
                <p className="font-medium">
                  {c.label || checkpointKindLabel(c.kind)} ·{' '}
                  <span className="tabular-nums">{c.volumeLiters} L</span>
                </p>
                <p className="text-[var(--mute)]">
                  {formatWhen(c.capturedAt)} · dens {c.density ?? '—'} ·{' '}
                  {c.temperature ?? '—'} °C
                  {c.waterDetected ? ' · agua' : ''}
                </p>
                <p className="text-xs text-[var(--mute)]">
                  GPS {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                  {c.note ? ` · ${c.note}` : ''}
                </p>
              </li>
            ))}
          </ol>
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
