'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { parseBatonPayloadParam } from '@/lib/baton-qr';
import { canAcceptCustody, homeForRole } from '@/lib/role-access';
import { labelEs, roleLabel } from '@/lib/es-labels';
import { useDispatchOptions } from '@/lib/use-dispatch-options';
import { QrScanButton } from '@/components/qr-scan-button';

type BatonData = {
  tokenId: string;
  status: string;
  eventType: string;
  volumeLiters: string;
  cisternCode: string | null;
  issuedByRole: string;
  consumedByRole: string | null;
  expiresAt?: string | null;
  payloadJson: Record<string, unknown>;
  batch: { batchCode: string; product: string };
  station: { code: string; name: string } | null;
};

function batonFromEmbedded(
  token: string,
  embedded: Record<string, unknown>,
): BatonData {
  const exp =
    typeof embedded.exp === 'number'
      ? new Date(embedded.exp * 1000).toISOString()
      : null;
  return {
    tokenId: token,
    status: 'ACTIVE',
    eventType: String(embedded.ev ?? 'IN_TRANSIT'),
    volumeLiters: String(embedded.vol ?? ''),
    cisternCode: embedded.cistern ? String(embedded.cistern) : null,
    issuedByRole: String(embedded.role ?? 'TRANSPORTER'),
    consumedByRole: null,
    expiresAt: exp,
    payloadJson: embedded,
    batch: {
      batchCode: String(embedded.batch ?? '—'),
      product: '—',
    },
    station: null,
  };
}

function QrBatonInner() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, ready, authHeaders } = useAuth();
  const { stations } = useDispatchOptions(authHeaders);
  const [baton, setBaton] = useState<BatonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stationCode, setStationCode] = useState('ST-CBB-01');
  const [receivedVol, setReceivedVol] = useState('');
  const [recvDensity, setRecvDensity] = useState('0.745');
  const [recvTemp, setRecvTemp] = useState('22');
  const [recvWater, setRecvWater] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [offlineQueue, setOfflineQueue] = useState(0);

  const here = `${pathname}?${searchParams.toString()}`.replace(/\?$/, '');
  const loginHref = `/login?next=${encodeURIComponent(here)}`;
  const canAccept = canAcceptCustody(user?.role);

  useEffect(() => {
    if (user?.stationCode) setStationCode(user.stationCode);
  }, [user?.stationCode]);

  useEffect(() => {
    const embedded = parseBatonPayloadParam(searchParams.get('p'));
    if (embedded) {
      localStorage.setItem(`fc-baton-${token}`, JSON.stringify(embedded));
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/custody-qr/${token}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setBaton(json.data);
          setReceivedVol(String(json.data.volumeLiters ?? ''));
          if (json.data.station?.code) {
            setStationCode(json.data.station.code);
          }
        }
      } catch (e) {
        if (cancelled) return;
        const cached =
          embedded ??
          (() => {
            try {
              const raw = localStorage.getItem(`fc-baton-${token}`);
              return raw
                ? (JSON.parse(raw) as Record<string, unknown>)
                : null;
            } catch {
              return null;
            }
          })();
        if (cached) {
          setBaton(batonFromEmbedded(token, cached));
          setReceivedVol(String(cached.vol ?? ''));
          setError(null);
          setMsg(
            'Sin señal: leímos el QR firmado. Para aceptar hace falta sesión y sincronizar.',
          );
        } else {
          setError(
            e instanceof Error
              ? e.message
              : 'Sin señal o bastón desconocido en servidor',
          );
        }
      }
    })();
    try {
      const q = JSON.parse(
        localStorage.getItem('fc-offline-queue') || '[]',
      ) as unknown[];
      setOfflineQueue(q.length);
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
    };
  }, [token, searchParams]);

  function acceptOnline() {
    if (!baton || !canAccept) return;
    startTransition(async () => {
      setMsg(null);
      try {
        const res = await fetch(`${API_URL}/custody-qr/accept`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            tokenId: baton.tokenId,
            embedded: baton.payloadJson,
            stationCode,
            receivedVolumeLiters: Number(receivedVol) || undefined,
            receivedDensity: Number(recvDensity),
            receivedTemperature: Number(recvTemp),
            receivedWaterDetected: recvWater,
          }),
        });
        if (!res.ok) throw await errorFromResponse(res, 'No se pudo aceptar el bastón.');
        const json = await res.json();
        setBaton({
          ...baton,
          status: json.data.status,
          consumedByRole: user?.role ?? null,
        });
        const bits = [
          'Bastón aceptado. Inventario de tu estación actualizado.',
        ];
        if (json.movement?.status) {
          bits.push(`Movimiento: ${labelEs(json.movement.status)}.`);
        }
        if (json.anomaly) {
          bits.push('Señal de discrepancia abierta (revisión humana).');
        }
        if (json.blockchain?.status) {
          bits.push(`Evidencia en cadena: ${labelEs(json.blockchain.status)}.`);
        }
        if (json.settlement?.amountBob != null) {
          bits.push(
            `Liquidación DEMO: ${Number(json.settlement.amountBob).toLocaleString('es-BO')} Bs (pendiente de pago).`,
          );
        }
        setMsg(bits.join(' '));
      } catch (e) {
        setMsg(
          `Falló la conexión — se guarda sin señal: ${friendlyError(e, 'Error de red')}`,
        );
        enqueueOffline();
      }
    });
  }

  function enqueueOffline() {
    if (!baton) return;
    if (!user || !canAccept) {
      setMsg(
        'Iniciá sesión como encargado de estación para encolar la recepción.',
      );
      return;
    }
    const clientEventId = `off-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item = {
      clientEventId,
      batonTokenId: baton.tokenId,
      batchCode: baton.batch.batchCode,
      stationCode,
      eventType: 'ACCEPT_BATON',
      payload: {
        ...baton.payloadJson,
        receivedVolumeLiters: Number(receivedVol) || undefined,
        receivedDensity: Number(recvDensity),
        receivedTemperature: Number(recvTemp),
        receivedWaterDetected: recvWater,
      },
      capturedAt: new Date().toISOString(),
    };
    const q = JSON.parse(
      localStorage.getItem('fc-offline-queue') || '[]',
    ) as unknown[];
    q.push(item);
    localStorage.setItem('fc-offline-queue', JSON.stringify(q));
    localStorage.setItem(
      `fc-baton-${baton.tokenId}`,
      JSON.stringify(baton.payloadJson),
    );
    setOfflineQueue(q.length);
    setMsg(
      `Guardado sin señal (${clientEventId}). Usá «Sincronizar cola» abajo cuando haya conexión.`,
    );
  }

  function syncQueue() {
    startTransition(async () => {
      setMsg(null);
      try {
        const events = JSON.parse(
          localStorage.getItem('fc-offline-queue') || '[]',
        ) as Array<Record<string, unknown>>;
        if (!events.length) {
          setMsg('Cola vacía.');
          return;
        }
        const res = await fetch(`${API_URL}/custody-qr/sync`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ events }),
        });
        if (!res.ok) throw await errorFromResponse(res, 'No se pudo sincronizar.');
        await res.json();
        localStorage.setItem('fc-offline-queue', '[]');
        setOfflineQueue(0);
        setMsg('Sincronización lista.');
      } catch (e) {
        setMsg(friendlyError(e, 'No se pudo sincronizar'));
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="fc-stamp text-[var(--mute)]">Bastón QR · DEMO</p>
        <h1 className="mt-2 font-display text-3xl font-black">
          Recepción en estación
        </h1>
        <p className="mt-2 text-sm text-[var(--mute)]">
          Token <code>{token}</code>. Cierre del camino trazable: el encargado
          de la EESS verifica litros y calidad al recibir (no inventa la
          calidad de carga).
        </p>
        <div className="mt-4">
          <QrScanButton />
        </div>
      </header>

      {error && !baton && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      {baton && (
        <section className="fc-sheet space-y-3">
          <p>
            Lote{' '}
            <span className="fc-batch-code text-[var(--diesel)]">
              {baton.batch.batchCode}
            </span>
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-[var(--mute)]">Estado</dt>
            <dd className="font-semibold">{labelEs(baton.status)}</dd>
            <dt className="text-[var(--mute)]">Evento</dt>
            <dd>{labelEs(baton.eventType)}</dd>
            <dt className="text-[var(--mute)]">Cisterna</dt>
            <dd>{baton.cisternCode ?? '—'}</dd>
            <dt className="text-[var(--mute)]">Volumen</dt>
            <dd className="tabular-nums">{baton.volumeLiters} L</dd>
            <dt className="text-[var(--mute)]">Emitió</dt>
            <dd>{roleLabel(baton.issuedByRole)}</dd>
            {baton.expiresAt && (
              <>
                <dt className="text-[var(--mute)]">Expira</dt>
                <dd className="text-xs">{baton.expiresAt}</dd>
              </>
            )}
          </dl>

          {baton.status === 'ACTIVE' && !user && ready && (
            <div className="space-y-3 border-t border-[var(--rail)]/40 pt-4">
              <p className="text-sm text-[var(--mute)]">
                Para confirmar la recepción necesitás entrar como encargado de
                estación. El token se conserva.
              </p>
              <Link
                href={loginHref}
                className="inline-block bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)]"
              >
                Entrar y aceptar este bastón
              </Link>
            </div>
          )}

          {baton.status === 'ACTIVE' && user && !canAccept && (
            <div className="space-y-2 border-t border-[var(--rail)]/40 pt-4 text-sm">
              <p className="text-[var(--alarm)]">
                Tu rol ({roleLabel(user.role)}) no recibe en estación. Entrá con
                estacion@.
              </p>
              <Link
                href={homeForRole(user.role)}
                className="inline-block underline"
              >
                Ir a tu panel
              </Link>
            </div>
          )}

          {baton.status === 'ACTIVE' && canAccept && (
            <div className="space-y-3 border-t border-[var(--rail)]/40 pt-4">
              <label className="block text-sm">
                Estación recepción
                <select
                  className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  disabled={Boolean(user?.stationCode)}
                >
                  {stations.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              {user?.stationCode && (
                <p className="text-xs text-[var(--mute)]">
                  Bloqueada a tu EESS asignada ({user.stationCode}).
                </p>
              )}
              <label className="block text-sm">
                Litros recibidos
                <input
                  className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
                  value={receivedVol}
                  onChange={(e) => setReceivedVol(e.target.value)}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  Densidad medida
                  <input
                    className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
                    value={recvDensity}
                    onChange={(e) => setRecvDensity(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Temp. °C
                  <input
                    className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
                    value={recvTemp}
                    onChange={(e) => setRecvTemp(e.target.value)}
                  />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={recvWater}
                    onChange={(e) => setRecvWater(e.target.checked)}
                  />
                  Agua detectada
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={acceptOnline}
                  className="bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
                >
                  Aceptar (con señal)
                </button>
                <button
                  type="button"
                  onClick={enqueueOffline}
                  className="border-2 border-[var(--ink)] px-4 py-2 text-sm font-semibold"
                >
                  Guardar sin señal
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {msg && <p className="text-sm">{msg}</p>}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--mute)]">
        <span>Cola local sin señal: {offlineQueue} evento(s).</span>
        {user && offlineQueue > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={syncQueue}
            className="font-semibold text-[var(--diesel)] underline disabled:opacity-50"
          >
            Sincronizar cola
          </button>
        )}
        {user?.role === 'STATION_STAFF' && (
          <Link href="/estacion" className="underline">
            Ver mi estación
          </Link>
        )}
      </div>
    </div>
  );
}

export default function QrBatonPage() {
  return (
    <Suspense
      fallback={<p className="text-[var(--mute)]">Cargando bastón…</p>}
    >
      <QrBatonInner />
    </Suspense>
  );
}
