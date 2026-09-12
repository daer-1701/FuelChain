'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { batonDeepLink } from '@/lib/baton-qr';
import { canDispatchFuel, homeForRole } from '@/lib/role-access';
import { roleLabel } from '@/lib/es-labels';
import { useDispatchOptions } from '@/lib/use-dispatch-options';

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
  const { batches, stations } = useDispatchOptions(authHeaders);
  const [batchCode, setBatchCode] = useState('FC-BO-2026-000182');
  const [volume, setVolume] = useState('8000');
  const [cistern, setCistern] = useState(user?.cisternCode ?? 'CIS-CBB-01');
  const [stationCode, setStationCode] = useState('ST-CBB-01');
  const [density, setDensity] = useState('0.745');
  const [temperature, setTemperature] = useState('22');
  const [water, setWater] = useState(false);
  const [issued, setIssued] = useState<IssueResult['data'] | null>(null);
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [queueLen, setQueueLen] = useState(0);
  const [log, setLog] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [lookup, setLookup] = useState('');
  const canIssue = canDispatchFuel(user?.role);

  useEffect(() => {
    if (user?.cisternCode) setCistern(user.cisternCode);
  }, [user?.cisternCode]);

  useEffect(() => {
    if (batches[0] && !batches.some((b) => b.code === batchCode)) {
      setBatchCode(batches[0].code);
    }
  }, [batches, batchCode]);

  useEffect(() => {
    if (stations[0] && !stations.some((s) => s.code === stationCode)) {
      setStationCode(stations[0].code);
    }
  }, [stations, stationCode]);

  useEffect(() => {
    let cancelled = false;
    if (!issued) {
      setQrImg(null);
      return;
    }
    const target =
      typeof window !== 'undefined'
        ? batonDeepLink(
            window.location.origin,
            issued.tokenId,
            issued.qrPayload,
          )
        : issued.deepLinkPath;
    void import('qrcode')
      .then((QR) => QR.toDataURL(target, { width: 220, margin: 1 }))
      .then((url) => {
        if (!cancelled) setQrImg(url);
      })
      .catch(() => {
        if (!cancelled) setQrImg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [issued]);

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
            loadDensity: Number(density),
            loadTemperature: Number(temperature),
            loadWaterDetected: water,
          }),
        });
        if (!res.ok) throw await errorFromResponse(res, 'No se pudo emitir el QR.');
        const json = (await res.json()) as IssueResult;
        setIssued(json.data);
        localStorage.setItem(
          `fc-baton-${json.data.tokenId}`,
          JSON.stringify(json.data.qrPayload),
        );
        setLog(`Bastón emitido: ${json.data.tokenId}`);
      } catch (e) {
        setLog(friendlyError(e, 'Error al emitir'));
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
        if (!res.ok) throw await errorFromResponse(res, 'No se pudo sincronizar.');
        const json = await res.json();
        localStorage.setItem('fc-offline-queue', '[]');
        setQueueLen(0);
        setLog('Sincronización lista.');
      } catch (e) {
        setLog(friendlyError(e, 'No se pudo sincronizar'));
      }
    });
  }

  if (user && !canIssue) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-black">QR custodia</h1>
        <p className="text-[var(--mute)]">
          Emitir QR es trabajo del chofer o depósito. Tu rol (
          {roleLabel(user.role)}) no despacha. Si sos estación, escaneá el QR
          que te muestra el chofer.
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
    <div className="fc-page">
      <header className="fc-page-header">
        <p className="fc-stamp text-[var(--mute)]">Chofer · registro de viaje</p>
        <h1 className="fc-title mt-2">
          Registrar viaje
        </h1>
        <p className="fc-lede">
          Emite el QR del despacho: lote, cisterna, litros y calidad de carga.
          Eso abre el camino trazable. Después registrá{' '}
          <Link href="/tramos" className="text-[var(--diesel)] underline">
            tramos del viaje
          </Link>{' '}
          (salida → ruta → llegada). La estación verifica litros y calidad al
          recibir.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="fc-sheet space-y-4">
          <h2 className="fc-section-title">Emitir bastón</h2>
          <label className="fc-label">
            Lote
            <select
              className="fc-field"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="fc-label">
            Cisterna
            <input
              className="fc-field"
              value={cistern}
              onChange={(e) => setCistern(e.target.value)}
              readOnly={Boolean(user?.cisternCode)}
            />
          </label>
          <label className="fc-label">
            Estación destino
            <select
              className="fc-field"
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value)}
            >
              {stations.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="fc-label">
            Litros del viaje
            <input
              className="fc-field fc-num"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="fc-label">
              Densidad
              <input
                className="fc-field fc-num"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
              />
            </label>
            <label className="fc-label">
              Temp. °C
              <input
                className="fc-field fc-num"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={water}
                onChange={(e) => setWater(e.target.checked)}
              />
              Agua detectada
            </label>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={issue}
<<<<<<< HEAD
            className="bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
=======
            aria-busy={pending}
            className="fc-btn fc-btn-ink"
>>>>>>> 551b0ec (Polish FuelChain UI and UX across web app)
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
                Datos del QR (sin señal): {issued.qrText.slice(0, 120)}…
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="fc-sheet space-y-3">
            <h2 className="fc-section-title">Cola sin señal</h2>
            <p className="fc-meta">
              Eventos en este teléfono: <strong className="text-[var(--ink)]">{queueLen}</strong>
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={syncQueue}
              className="fc-btn fc-btn-ghost"
            >
              Sincronizar ahora
            </button>
          </div>

          <div className="fc-sheet space-y-3">
            <h2 className="fc-section-title">Verificar lote</h2>
            <label className="fc-label">
              Código de lote
              <input
                className="fc-field"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="FC-BO-2026-000184"
              />
            </label>
            <Link
              href={lookup ? `/batches/${lookup}` : '/batches'}
              className="fc-btn inline-flex"
            >
              Abrir pasaporte
            </Link>
            <p className="fc-meta">
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
