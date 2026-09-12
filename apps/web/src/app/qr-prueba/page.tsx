'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { QrScanButton } from '@/components/qr-scan-button';
import { API_URL } from '@/lib/api';
import { friendlyError } from '@/lib/api-error';
import { labelEs } from '@/lib/es-labels';

type Sticker = {
  code: string;
  qrToken: string;
  deviceId: string;
  plate: string | null;
  status: string;
  currentLoadLiters: string;
  deepLinkPath: string;
  currentBatch: { batchCode: string; product: string } | null;
};

export default function QrPruebaPage() {
  const [rows, setRows] = useState<Sticker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/c`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as {
          note?: string;
          data: Sticker[];
        };
        if (!cancelled) {
          setRows(json.data ?? []);
          setNote(json.note ?? null);
        }
      } catch (e) {
        if (!cancelled) setError(friendlyError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.qrToken.toLowerCase().includes(q) ||
        r.deviceId.toLowerCase().includes(q),
    );
  }, [rows, filter]);

  return (
    <main className="fc-page mx-auto max-w-[var(--fc-max)] px-4 py-8 md:px-8">
      <header className="fc-page-header space-y-3">
        <p className="fc-stamp text-[var(--mute)]">
          Prueba DEMO · llegada a estación
        </p>
        <h1 className="fc-title">50 imágenes QR de cisterna</h1>
        <p className="fc-lede">
          Cada PNG simula el sticker pegado en la cisterna. Escanealo con la
          cámara (login estacion@) → se abre la cisterna →{' '}
          <strong>Subir camino</strong> carga cantidad + calidad con hora y GPS.
        </p>
        {note && <p className="fc-meta">{note}</p>}
        <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--mute)]">
          <li>
            Login <code>estacion@fuelchain.bo</code> / <code>demo123</code>
          </li>
          <li>
            Pulsá <strong>Escanear QR</strong> y apuntá a una imagen de abajo
          </li>
          <li>
            En la ficha: <strong>Escanear / subir camino</strong>
          </li>
        </ol>
        <div className="flex flex-wrap items-end gap-3 pt-2">
          <label className="fc-label">
            Filtrar
            <input
              className="fc-input mt-1 block w-56"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="CIS-CBB-12 / CQ-…"
            />
          </label>
          <QrScanButton />
          <a
            href="/qr-cisternas/index.html"
            target="_blank"
            rel="noreferrer"
            className="fc-btn fc-btn-ghost"
          >
            Abrir hoja imprimible (50 QR)
          </a>
          <Link href="/estacion" className="fc-btn fc-btn-ghost">
            Mi estación
          </Link>
        </div>
      </header>

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      <p className="fc-meta">
        Mostrando {filtered.length} de {rows.length} · archivos en{' '}
        <code>public/qr-cisternas/</code>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((r) => (
          <article
            key={r.qrToken}
            className="fc-sheet flex flex-col gap-3 !p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/qr-cisternas/${r.qrToken}.png`}
              alt={`QR ${r.qrToken}`}
              width={180}
              height={180}
              className="mx-auto border border-[var(--ink)] bg-white p-1"
            />
            <h2 className="text-center font-display text-base font-bold">
              {r.code}
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
              <dt className="text-[var(--mute)]">QR</dt>
              <dd className="font-mono">{r.qrToken}</dd>
              <dt className="text-[var(--mute)]">Device</dt>
              <dd className="font-mono">{r.deviceId}</dd>
              <dt className="text-[var(--mute)]">Estado</dt>
              <dd>{labelEs(r.status)}</dd>
              <dt className="text-[var(--mute)]">Carga</dt>
              <dd className="tabular-nums">{r.currentLoadLiters} L</dd>
            </dl>
            <div className="mt-auto flex flex-col gap-2">
              <a
                href={`/qr-cisternas/${r.qrToken}.png`}
                download={`${r.qrToken}.png`}
                className="fc-btn fc-btn-ghost w-full"
              >
                Descargar PNG
              </a>
              <Link
                href={r.deepLinkPath}
                className="fc-btn fc-btn-ink w-full"
              >
                Abrir cisterna
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
