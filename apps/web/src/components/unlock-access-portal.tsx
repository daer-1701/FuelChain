'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { friendlyError } from '@/lib/api-error';
import { checkpointKindLabel, labelEs } from '@/lib/es-labels';
import { PRODUCT_FOCUS, PATH_STEPS } from '@/lib/product-copy';
import {
  UNLOCK_LOCK_ADDRESS,
  UNLOCK_NETWORK,
  UNLOCK_NETWORK_LABEL,
  unlockCheckoutUrl,
  unlockDashboardLockUrl,
} from '@/lib/unlock';
import { useUnlockMembership } from '@/lib/use-unlock-membership';

type PathReport = {
  label: string;
  note: string;
  unlockedBy: string;
  data: {
    summary: {
      stations: number;
      openDeliveries: number;
      checkpoints: number;
      qualityAlerts: number;
    };
    journeys: Array<{
      deliveryId: string;
      status: string;
      cisternCode: string;
      stationCode: string;
      stationName: string;
      batchCode: string;
      product: string;
      loadedLiters: number;
      receivedLiters: number | null;
      loadDensity: number | null;
      loadTemperature: number | null;
      loadWaterDetected: boolean | null;
      receivedDensity: number | null;
      receivedTemperature: number | null;
      receivedWaterDetected: boolean | null;
      checkpoints: Array<{
        kind: string;
        volumeLiters: number;
        density: number | null;
        temperature: number | null;
        waterDetected: boolean;
        capturedAt: string;
        label: string | null;
      }>;
    }>;
  };
};

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function liters(n: number) {
  return `${Math.round(n).toLocaleString('es-BO')} L`;
}

export function UnlockAccessPortal() {
  const membership = useUnlockMembership();
  const [report, setReport] = useState<PathReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    setRedirectUri(`${window.location.origin}/acceso`);
  }, []);

  useEffect(() => {
    if (!membership.hasKey) {
      setReport(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/stations/unlock-report`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as PathReport;
        if (!cancelled) setReport(json);
      } catch (e) {
        if (!cancelled) {
          setLoadError(friendlyError(e, 'No se pudo cargar el informe'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [membership.hasKey]);

  const networkLabel =
    UNLOCK_NETWORK_LABEL[UNLOCK_NETWORK] ?? `chain ${UNLOCK_NETWORK}`;
  const checkout = redirectUri ? unlockCheckoutUrl(redirectUri) : '#';

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">
          Unlock Protocol · portal token-gated DEMO
        </p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">
          Acceso verificador
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          {PRODUCT_FOCUS} Este portal desbloquea el informe de{' '}
          <strong>cantidad y calidad por tramo</strong> ({PATH_STEPS}) con una
          Key Unlock (membresía ERC-721). Sin Key no hay acceso al contenido
          regulatorio.
        </p>
      </header>

      <section className="fc-sheet space-y-4 border-2 border-[var(--ink)]">
        <h2 className="font-display text-xl font-bold">Membresía Unlock</h2>
        {!membership.configured ? (
          <div className="space-y-3 text-sm text-[var(--mute)]">
            <p role="status">
              Falta configurar el Lock. Creá uno en{' '}
              <a
                className="text-[var(--diesel)] underline"
                href="https://app.unlock-protocol.com"
                target="_blank"
                rel="noreferrer"
              >
                app.unlock-protocol.com
              </a>{' '}
              (recomendado: Base Sepolia) y poné en el `.env` de la web:
            </p>
            <pre className="overflow-x-auto border border-[var(--rail)]/50 bg-[var(--paper)] p-3 text-xs text-[var(--ink)]">
              {`NEXT_PUBLIC_UNLOCK_LOCK_ADDRESS=0x…
NEXT_PUBLIC_UNLOCK_NETWORK=84532
NEXT_PUBLIC_UNLOCK_RPC_URL=https://sepolia.base.org`}
            </pre>
            <p>
              Guía completa: <code>docs/unlock-feria.md</code>
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p>
              Lock{' '}
              <a
                className="font-mono text-[var(--diesel)] underline"
                href={unlockDashboardLockUrl()}
                target="_blank"
                rel="noreferrer"
              >
                {shortAddr(UNLOCK_LOCK_ADDRESS)}
              </a>{' '}
              · {networkLabel} ({UNLOCK_NETWORK})
            </p>
            {membership.address ? (
              <p>
                Wallet: <span className="font-mono">{shortAddr(membership.address)}</span>
                {' · '}
                {membership.checking
                  ? 'Verificando Key…'
                  : membership.hasKey
                    ? 'Key válida — acceso desbloqueado'
                    : 'Sin Key válida'}
              </p>
            ) : (
              <p className="text-[var(--mute)]">
                Conectá tu wallet para verificar si tenés una Key del Lock.
              </p>
            )}
            {membership.error && (
              <p role="alert" className="text-[var(--alarm)]">
                {membership.error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {!membership.address ? (
                <button
                  type="button"
                  disabled={membership.connecting}
                  onClick={() => void membership.connect()}
                  className="bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
                >
                  {membership.connecting ? 'Conectando…' : 'Conectar wallet'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void membership.refresh()}
                    className="border-2 border-[var(--ink)] px-4 py-2 text-sm font-semibold"
                  >
                    Revalidar Key
                  </button>
                  <button
                    type="button"
                    onClick={membership.disconnect}
                    className="border border-[var(--rail)] px-4 py-2 text-sm"
                  >
                    Desconectar
                  </button>
                </>
              )}
              {!membership.hasKey && (
                <a
                  href={checkout}
                  className="bg-[var(--diesel)] px-4 py-2 text-sm font-semibold text-[var(--paper)]"
                >
                  Obtener membresía (Unlock Checkout)
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {!membership.hasKey && (
        <section className="space-y-3 border border-dashed border-[var(--rail)] p-6">
          <h2 className="font-display text-lg font-bold text-[var(--mute)]">
            Contenido bloqueado
          </h2>
          <p className="text-sm text-[var(--mute)]">
            Tras desbloquear verás: resumen de la red, viajes con litros y
            calidad de carga/recepción, y tramos GPS (salida → ruta → llegada).
            Eso es lo que ANH necesita para auditar el camino — detrás de una
            membresía onchain.
          </p>
          <ul className="list-inside list-disc text-sm text-[var(--mute)]">
            <li>Cantidad por tramo</li>
            <li>Densidad / temperatura / agua</li>
            <li>Estación destino y lote</li>
          </ul>
        </section>
      )}

      {membership.hasKey && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-black">
                Informe de camino
              </h2>
              <p className="mt-1 text-sm text-[var(--mute)]">
                {report?.note ?? 'Cargando evidencia DEMO…'}
              </p>
            </div>
            <Link
              href="/supervision"
              className="text-sm font-semibold text-[var(--diesel)] underline"
            >
              Ir a supervisión (sesión ANH)
            </Link>
          </div>

          {loadError && (
            <p role="alert" className="text-[var(--alarm)]">
              {loadError}
            </p>
          )}

          {report && (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Stat label="EESS" value={String(report.data.summary.stations)} />
                <Stat
                  label="Entregas abiertas"
                  value={String(report.data.summary.openDeliveries)}
                />
                <Stat
                  label="Tramos"
                  value={String(report.data.summary.checkpoints)}
                />
                <Stat
                  label="Alertas calidad"
                  value={String(report.data.summary.qualityAlerts)}
                />
              </div>

              <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
                {report.data.journeys.map((j) => (
                  <li key={j.deliveryId} className="space-y-3 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg font-bold">
                          {j.cisternCode} → {j.stationName || j.stationCode}
                        </p>
                        <p className="mt-1 text-sm text-[var(--mute)]">
                          Lote{' '}
                          <span className="fc-batch-code text-[var(--diesel)]">
                            {j.batchCode}
                          </span>{' '}
                          · {j.product} · {labelEs(j.status)}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums">
                        {liters(j.loadedLiters)}
                        {j.receivedLiters != null
                          ? ` → ${liters(j.receivedLiters)}`
                          : ''}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--mute)]">
                      Carga:{' '}
                      {j.loadDensity != null ? `ρ ${j.loadDensity}` : '—'}
                      {j.loadTemperature != null
                        ? ` · ${j.loadTemperature} °C`
                        : ''}
                      {j.loadWaterDetected ? ' · agua' : ''}
                      {' · '}Recepción:{' '}
                      {j.receivedDensity != null
                        ? `ρ ${j.receivedDensity}`
                        : '—'}
                      {j.receivedTemperature != null
                        ? ` · ${j.receivedTemperature} °C`
                        : ''}
                      {j.receivedWaterDetected ? ' · agua' : ''}
                    </p>
                    {j.checkpoints.length > 0 && (
                      <ol className="space-y-1 text-sm">
                        {j.checkpoints.map((c, i) => (
                          <li key={`${j.deliveryId}-${i}`}>
                            <strong>{checkpointKindLabel(c.kind)}</strong>
                            {c.label ? ` · ${c.label}` : ''} —{' '}
                            {liters(c.volumeLiters)}
                            {c.density != null ? ` · ρ ${c.density}` : ''}
                            {c.waterDetected ? ' · agua' : ''}
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ul>
              {report.data.journeys.length === 0 && (
                <p className="text-[var(--mute)]">
                  Todavía no hay viajes DEMO con tramos. Emití un QR y registrá
                  checkpoints en /tramos.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--rail)]/50 px-3 py-3">
      <p className="text-xs text-[var(--mute)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-black tabular-nums">
        {value}
      </p>
    </div>
  );
}
