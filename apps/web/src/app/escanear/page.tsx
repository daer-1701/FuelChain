'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { QrScanButton } from '@/components/qr-scan-button';
import {
  MetricRail,
  OpsPageHeader,
  StatusPill,
} from '@/components/ops';
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

  const withStatus = history.filter((h) => h.status).length;

  return (
    <div className="fc-page">
      <OpsPageHeader
        stamp={`Estación · recepción por QR${user.stationCode ? ` · ${user.stationCode}` : ''}`}
        title="Escanear cisterna"
        lede="Solo escaneá o subí la foto del sticker de la cisterna. Al leerlo abrís el detalle y el historial del camino (litros, calidad, GPS)."
        actions={
          <Link href="/estacion" className="fc-btn fc-btn-ghost !text-xs">
            Mi estación
          </Link>
        }
      />

      <MetricRail
        items={[
          {
            label: 'Escaneos',
            value: String(history.length),
            hint: 'En este navegador',
          },
          {
            label: 'Con estado',
            value: String(withStatus),
            tone: withStatus > 0 ? 'info' : 'mute',
          },
          {
            label: 'EESS',
            value: user.stationCode ?? '—',
          },
          {
            label: 'Modo',
            value: 'Recepción',
            tone: 'ok',
          },
        ]}
      />

      <section className="space-y-4 border-2 border-[var(--ink)] p-5">
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
              <li
                key={`${h.token}-${h.scannedAt}`}
                className="flex flex-wrap items-start justify-between gap-3 py-4 fc-ops-rise"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold">
                      {h.cisternCode ?? h.token}
                    </p>
                    {h.status ? (
                      <StatusPill label={labelEs(h.status)} tone="info" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--mute)]">
                    Escaneado {when(h.scannedAt)}
                    {h.batchCode ? ` · lote ${h.batchCode}` : ''}
                    {h.product ? ` · ${h.product}` : ''}
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
