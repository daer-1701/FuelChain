'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { API_URL } from '@/lib/api';

type BatonData = {
  tokenId: string;
  status: string;
  eventType: string;
  volumeLiters: string;
  cisternCode: string | null;
  issuedByRole: string;
  consumedByRole: string | null;
  payloadJson: Record<string, unknown>;
  batch: { batchCode: string; product: string };
  station: { code: string; name: string } | null;
};

export default function QrBatonPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [baton, setBaton] = useState<BatonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stationCode, setStationCode] = useState('ST-CBB-01');
  const [receivedVol, setReceivedVol] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [offlineQueue, setOfflineQueue] = useState(0);

  useEffect(() => {
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
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : 'Sin señal o bastón desconocido en servidor',
          );
          // Offline: try localStorage payload saved from QR scan
          try {
            const raw = localStorage.getItem(`fc-baton-${token}`);
            if (raw) {
              const embedded = JSON.parse(raw) as Record<string, unknown>;
              setBaton({
                tokenId: token,
                status: 'ACTIVE',
                eventType: String(embedded.ev ?? 'IN_TRANSIT'),
                volumeLiters: String(embedded.vol ?? ''),
                cisternCode: embedded.cistern
                  ? String(embedded.cistern)
                  : null,
                issuedByRole: String(embedded.role ?? 'TRANSPORTER'),
                consumedByRole: null,
                payloadJson: embedded,
                batch: {
                  batchCode: String(embedded.batch ?? '—'),
                  product: '—',
                },
                station: null,
              });
              setError(null);
              setMsg(
                'Modo offline: payload leído del teléfono. Aceptar encola sync.',
              );
            }
          } catch {
            /* ignore */
          }
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
  }, [token]);

  function acceptOnline() {
    if (!baton) return;
    startTransition(async () => {
      setMsg(null);
      try {
        const res = await fetch(`${API_URL}/custody-qr/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId: baton.tokenId,
            embedded: baton.payloadJson,
            consumedByRole: 'DEPOT_OPERATOR',
            stationCode,
            receivedVolumeLiters: Number(receivedVol) || undefined,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setBaton({ ...baton, status: json.data.status, consumedByRole: 'DEPOT_OPERATOR' });
        setMsg('Bastón aceptado y custodia RECEIVED registrada.');
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
    const clientEventId = `off-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item = {
      clientEventId,
      batonTokenId: baton.tokenId,
      batchCode: baton.batch.batchCode,
      stationCode,
      actorRole: 'DEPOT_OPERATOR',
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
          Token <code>{token}</code>. Funciona sin señal si el QR trajo el
          payload al teléfono.
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
            <Link
              href={`/batches/${baton.batch.batchCode}`}
              className="fc-batch-code text-[var(--diesel)]"
            >
              {baton.batch.batchCode}
            </Link>
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
          </dl>

          {baton.status === 'ACTIVE' && (
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
