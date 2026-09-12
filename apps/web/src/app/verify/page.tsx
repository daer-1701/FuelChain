'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { batonDeepLink } from '@/lib/baton-qr';
import { canDispatchFuel, homeForRole } from '@/lib/role-access';

type IssueResult = {
  data: {
    tokenId: string;
    qrText: string;
    deepLinkPath: string;
    qrPayload: Record<string, unknown>;
  };
  note?: string;
};

export default function VerifyPage() {
  const { authHeaders, user } = useAuth();
  const [batchCode, setBatchCode] = useState('FC-BO-2026-000182');
  const [volume, setVolume] = useState('8000');
  const [cistern, setCistern] = useState(user?.cisternCode ?? 'CIS-CBB-01');
  const [stationCode, setStationCode] = useState('ST-CBB-01');
  const [issued, setIssued] = useState<IssueResult['data'] | null>(null);
  const [queueLen, setQueueLen] = useState(0);
  const [log, setLog] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [lookup, setLookup] = useState('');
  const canIssue = canDispatchFuel(user?.role);

  useEffect(() => {
    if (user?.cisternCode) setCistern(user.cisternCode);
  }, [user?.cisternCode]);

  useEffect(() => {
    try {
      const q = JSON.parse(
        localStorage.getItem('fc-offline-queue') || '[]',
      ) as unknown[];
      setQueueLen(q.length);
    } catch {
      setQueueLen(0);
    }
  }, [log]);

  function issue() {
    if (!canIssue) return;
    startTransition(async () => {
      setLog(null);
      try {
        const res = await fetch(`${API_URL}/custody-qr/issue`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            batchCode,
            eventType: 'IN_TRANSIT',
            volumeLiters: Number(volume),
            cisternCode: cistern,
            stationCode,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as IssueResult;
        setIssued(json.data);
        localStorage.setItem(
          `fc-baton-${json.data.tokenId}`,
          JSON.stringify(json.data.qrPayload),
        );
        setLog(`Bastón emitido: ${json.data.tokenId}`);
      } catch (e) {
        setLog(e instanceof Error ? e.message : 'Error al emitir');
      }
    });
  }

  function syncQueue() {
    startTransition(async () => {
      setLog(null);
      try {
        const events = JSON.parse(
          localStorage.getItem('fc-offline-queue') || '[]',
        ) as Array<Record<string, unknown>>;
        if (!events.length) {
          setLog('Cola vacía.');
          return;
        }
        const res = await fetch(`${API_URL}/custody-qr/sync`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ events }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        localStorage.setItem('fc-offline-queue', '[]');
        setQueueLen(0);
        setLog(`Sync OK: ${JSON.stringify(json.results)}`);
      } catch (e) {
        setLog(e instanceof Error ? e.message : 'Sync falló');
      }
    });
  }

  const qrTarget = issued
    ? typeof window !== 'undefined'
      ? batonDeepLink(
          window.location.origin,
          issued.tokenId,
          issued.qrPayload,
        )
      : issued.deepLinkPath
    : null;
  const qrImg = qrTarget
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        qrTarget,
      )}`
    : null;

  if (user && !canIssue) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-black">QR custodia</h1>
        <p className="text-[var(--mute)]">
          Emitir QR es trabajo del chofer o depósito. Tu rol ({user.role}) no
          despacha. Si sos estación, escaneá el QR que te muestra el chofer.
        </p>
        <Link
          href={homeForRole(user.role)}
          className="inline-block border-2 border-[var(--ink)] px-4 py-2 text-sm font-semibold"
        >
          Ir a tu panel
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="max-w-xl">
        <p className="fc-stamp text-[var(--mute)]">Chofer · custodia QR</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight">
          Custodia QR Cochabamba
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          El QR es el token de un despacho: lote + cisterna + litros y calidad
          de carga. El chofer solo emite desde su cisterna asignada.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="fc-sheet space-y-4">
          <h2 className="font-display text-xl font-bold">Emitir bastón</h2>
          <label className="block text-sm">
            Lote
            <input
              className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Cisterna
            <input
              className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
              value={cistern}
              onChange={(e) => setCistern(e.target.value)}
              readOnly={Boolean(user?.cisternCode)}
            />
          </label>
          <label className="block text-sm">
            Estación destino
            <input
              className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Litros
            <input
              className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={issue}
            className="bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
          >
            Generar QR
          </button>
          {issued && (
            <div className="space-y-2 border-t border-[var(--rail)]/40 pt-4">
              {qrImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrImg}
                  alt={`QR bastón ${issued.tokenId}`}
                  width={220}
                  height={220}
                  className="border border-[var(--ink)] bg-white p-2"
                />
              )}
              <p className="text-sm">
                Abrir:{' '}
                <Link
                  href={issued.deepLinkPath}
                  className="text-[var(--diesel)] underline"
                >
                  {issued.deepLinkPath}
                </Link>
              </p>
              <p className="break-all text-xs text-[var(--mute)]">
                Payload compacto (offline): {issued.qrText.slice(0, 120)}…
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="fc-sheet space-y-3">
            <h2 className="font-display text-xl font-bold">Cola offline</h2>
            <p className="text-sm text-[var(--mute)]">
              Eventos en este teléfono: <strong>{queueLen}</strong>
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={syncQueue}
              className="border-2 border-[var(--ink)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Sincronizar ahora
            </button>
          </div>

          <div className="fc-sheet space-y-3">
            <h2 className="font-display text-xl font-bold">Verificar lote</h2>
            <label className="block text-sm">
              Código de lote
              <input
                className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="FC-BO-2026-000184"
              />
            </label>
            <Link
              href={lookup ? `/batches/${lookup}` : '/batches'}
              className="inline-block bg-[var(--diesel)] px-4 py-2 text-sm font-semibold text-[var(--paper)]"
            >
              Abrir pasaporte
            </Link>
            <p className="text-xs text-[var(--mute)]">
              Para comprobar un hash de recepción, abrí el pasaporte del lote y
              usá «Recalcular hash» en el movimiento. Mapa ciudadano:{' '}
              <Link href="/mapa" className="underline">
                /mapa
              </Link>
            </p>
          </div>
        </div>
      </section>

      {log && <p className="text-sm">{log}</p>}
    </div>
  );
}
