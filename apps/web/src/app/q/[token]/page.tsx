'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { parseBatonPayloadParam } from '@/lib/baton-qr';

const ACCEPT_ROLES = new Set(['ADMIN', 'STATION_STAFF', 'DEPOT_OPERATOR']);

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
  const [baton, setBaton] = useState<BatonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stationCode, setStationCode] = useState('ST-CBB-01');
  const [receivedVol, setReceivedVol] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [offlineQueue, setOfflineQueue] = useState(0);

  const here = `${pathname}?${searchParams.toString()}`.replace(/\?$/, '');
  const loginHref = `/login?next=${encodeURIComponent(here)}`;
  const canAccept = Boolean(user && ACCEPT_ROLES.has(user.role));

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
            'Vista offline: payload firmado leído del QR. Aceptar requiere sesión y sync.',
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
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setBaton({
          ...baton,
          status: json.data.status,
          consumedByRole: user?.role ?? null,
        });
        const bits = [
          'Bastón aceptado. Inventario actualizado como delta.',
        ];
        if (json.movement?.status) {
          bits.push(`Movimiento: ${json.movement.status}.`);
        }
        if (json.anomaly) {
          bits.push('Señal de discrepancia abierta (revisión humana).');
        }
        if (json.blockchain?.status) {
          bits.push(`Blockchain: ${json.blockchain.status}.`);
        }
        setMsg(bits.join(' '));
      } catch (e) {
        setMsg(
          e instanceof Error
            ? `Falló online — se encola offline: ${e.message}`
            : 'Error',
        );
        enqueueOffline();
      }
    });
  }

  function enqueueOffline() {
    if (!baton) return;
    if (!user) {
      setMsg('Iniciá sesión como estación para encolar la recepción.');
      return;
    }
    const clientEventId = `off-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item = {
      clientEventId,
      batonTokenId: baton.tokenId,
      batchCode: baton.batch.batchCode,
      stationCode,
      eventType: 'ACCEPT_BATON',
      payload: baton.payloadJson,
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
      `Guardado offline (${clientEventId}). Sync cuando haya señal en /verify.`,
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="fc-stamp text-[var(--mute)]">Bastón QR · DEMO</p>
        <h1 className="mt-2 font-display text-3xl font-black">Custodia</h1>
        <p className="mt-2 text-sm text-[var(--mute)]">
          Token <code>{token}</code>. La ficha es pública; aceptar exige sesión
          de estación o depósito.
        </p>
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
            <dd className="font-semibold">{baton.status}</dd>
            <dt className="text-[var(--mute)]">Evento</dt>
            <dd>{baton.eventType}</dd>
            <dt className="text-[var(--mute)]">Cisterna</dt>
            <dd>{baton.cisternCode ?? '—'}</dd>
            <dt className="text-[var(--mute)]">Volumen</dt>
            <dd className="tabular-nums">{baton.volumeLiters} L</dd>
            <dt className="text-[var(--mute)]">Emitió</dt>
            <dd>{baton.issuedByRole}</dd>
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
                estación o depósito. El token se conserva.
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
            <p className="border-t border-[var(--rail)]/40 pt-4 text-sm text-[var(--alarm)]">
              Tu rol ({user.role}) no puede aceptar custodia. Entrá con
              estacion@ o deposito@.
            </p>
          )}

          {baton.status === 'ACTIVE' && canAccept && (
            <div className="space-y-3 border-t border-[var(--rail)]/40 pt-4">
              <label className="block text-sm">
                Estación recepción
                <select
                  className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                >
                  <option value="ST-CBB-01">ST-CBB-01 Cala Cala</option>
                  <option value="ST-CBB-02">ST-CBB-02 Quillacollo</option>
                  <option value="ST-CBB-03">ST-CBB-03 Sacaba</option>
                  <option value="ST-CBB-04">ST-CBB-04 Tiquipaya</option>
                  <option value="ST-CBB-05">ST-CBB-05 Vinto</option>
                </select>
              </label>
              <label className="block text-sm">
                Litros recibidos
                <input
                  className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
                  value={receivedVol}
                  onChange={(e) => setReceivedVol(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={acceptOnline}
                  className="bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
                >
                  Aceptar (online)
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
      <p className="text-xs text-[var(--mute)]">
        Cola offline local: {offlineQueue} evento(s).{' '}
        <Link href="/verify" className="underline">
          Ir a sync
        </Link>
      </p>
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
