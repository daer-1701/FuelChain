'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { friendlyError } from '@/lib/api-error';
import { homeForRole } from '@/lib/role-access';
import { labelEs } from '@/lib/es-labels';

type CisternSticker = {
  code: string;
  qrToken: string;
  deviceId: string;
  plate: string | null;
  status: string;
  currentLoadLiters: string;
  deepLinkPath: string;
  currentBatch: { batchCode: string; product: string } | null;
};

export default function MiQrPage() {
  const { user, ready } = useAuth();
  const [sticker, setSticker] = useState<CisternSticker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const cisternCode = user?.cisternCode ?? null;
  const isDriver =
    user?.role === 'TRANSPORTER' || user?.role === 'DEPOT_OPERATOR';

  useEffect(() => {
    if (!ready || !cisternCode || !isDriver) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/c/${encodeURIComponent(cisternCode)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as {
          note?: string;
          data: { cistern: CisternSticker };
        };
        if (!cancelled) {
          setSticker(json.data.cistern);
          setNote(json.note ?? null);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(friendlyError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, cisternCode, isDriver]);

  if (!ready) {
    return <p className="text-[var(--mute)]">Cargando…</p>;
  }

  if (!user || !isDriver) {
    return (
      <div className="fc-page">
        <h1 className="fc-title">Mi QR</h1>
        <p className="fc-lede">Esta pantalla es solo para el chofer.</p>
        {user && (
          <Link href={homeForRole(user.role)} className="fc-btn fc-btn-ghost">
            Ir a tu panel
          </Link>
        )}
      </div>
    );
  }

  if (!cisternCode) {
    return (
      <div className="fc-page">
        <h1 className="fc-title">Mi QR</h1>
        <p className="fc-lede">
          Tu usuario DEMO no tiene cisterna asignada.
        </p>
      </div>
    );
  }

  return (
    <div className="fc-page">
      <header className="fc-page-header">
        <p className="fc-stamp text-[var(--mute)]">Chofer · sticker de cisterna</p>
        <h1 className="fc-title">Mi QR</h1>
        <p className="fc-lede">
          Solo el QR de tu cisterna <strong>{cisternCode}</strong>. La estación
          lo escanea al recibir.
        </p>
        {note && <p className="fc-meta">{note}</p>}
      </header>

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      {sticker && (
        <section className="fc-sheet mx-auto max-w-sm space-y-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/qr-cisternas/${sticker.qrToken}.png`}
            alt={`QR ${sticker.code}`}
            width={220}
            height={220}
            className="mx-auto border border-[var(--ink)] bg-white p-2"
          />
          <h2 className="font-display text-2xl font-bold">{sticker.code}</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left text-sm">
            <dt className="text-[var(--mute)]">Token QR</dt>
            <dd className="font-mono text-xs">{sticker.qrToken}</dd>
            <dt className="text-[var(--mute)]">Placa</dt>
            <dd>{sticker.plate ?? '—'}</dd>
            <dt className="text-[var(--mute)]">Estado</dt>
            <dd>{labelEs(sticker.status)}</dd>
            <dt className="text-[var(--mute)]">Carga</dt>
            <dd className="tabular-nums">{sticker.currentLoadLiters} L</dd>
            {sticker.currentBatch && (
              <>
                <dt className="text-[var(--mute)]">Lote</dt>
                <dd>
                  {sticker.currentBatch.batchCode} ·{' '}
                  {sticker.currentBatch.product}
                </dd>
              </>
            )}
          </dl>
          <div className="flex flex-col gap-2">
            <Link href={sticker.deepLinkPath} className="fc-btn">
              Abrir ficha del viaje
            </Link>
            <a
              href={`/qr-cisternas/${sticker.qrToken}.png`}
              download={`${sticker.qrToken}.png`}
              className="fc-btn fc-btn-ghost"
            >
              Descargar PNG
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
