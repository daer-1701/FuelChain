'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { QrScanButton } from '@/components/qr-scan-button';
import { labelEs } from '@/lib/es-labels';
import { homeForRole } from '@/lib/role-access';
import {
  clearStationScanHistory,
  loadStationScanHistory,
  rememberStationScan,
  type StationScanEntry,
} from '@/lib/station-scan-history';

function when(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function EscanearPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<StationScanEntry[]>([]);

  useEffect(() => {
    function refresh() {
      setHistory(loadStationScanHistory());
    }
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  function onToken(token: string) {
    const path = /^(CQ-|GW-|CIS-)/i.test(token) ? `/c/${token}` : `/q/${token}`;
    const list = rememberStationScan({ token, path });
    setHistory(list);
    router.push(path);
  }

  if (!ready) {
    return <p className="text-[var(--mute)]">Cargando…</p>;
  }

  if (!user || user.role !== 'STATION_STAFF') {
    return (
      <div className="fc-page">
        <h1 className="fc-title">Escanear QR</h1>
        <p className="fc-lede">
          Esta pantalla es solo para el personal de estación.
        </p>
        {user && (
          <Link href={homeForRole(user.role)} className="fc-btn fc-btn-ghost">
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
          Estación · recepción por QR
          {user.stationCode ? ` · ${user.stationCode}` : ''}
        </p>
        <h1 className="fc-title">Escanear cisterna</h1>
        <p className="fc-lede">
          Solo escaneá o subí la foto del sticker de la cisterna. No hace falta
          ver un catálogo de QR: al leerlo abrís el detalle y el historial del
          camino (litros, calidad, GPS).
        </p>
      </header>

      <section className="fc-sheet space-y-4">
        <h2 className="fc-section-title">Cámara o foto</h2>
        <QrScanButton onToken={onToken} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="fc-section-title">Historial escaneado</h2>
          {history.length > 0 && (
            <button
              type="button"
              className="fc-btn fc-btn-ghost !py-1.5 !text-xs"
              onClick={() => {
                clearStationScanHistory();
                setHistory([]);
              }}
            >
              Limpiar historial
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-[var(--mute)]">
            Todavía no escaneaste ningún QR en este navegador.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
            {history.map((h) => (
              <li key={`${h.token}-${h.scannedAt}`} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold">
                      {h.cisternCode ?? h.token}
                    </p>
                    <p className="mt-1 text-sm text-[var(--mute)]">
                      Escaneado {when(h.scannedAt)}
                      {h.batchCode ? ` · lote ${h.batchCode}` : ''}
                      {h.product ? ` · ${h.product}` : ''}
                      {h.status ? ` · ${labelEs(h.status)}` : ''}
                    </p>
                    {h.deviceId && (
                      <p className="mt-0.5 font-mono text-xs text-[var(--mute)]">
                        device {h.deviceId}
                      </p>
                    )}
                  </div>
                  <Link href={h.path} className="fc-btn fc-btn-ink !py-2">
                    Ver detalle
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
