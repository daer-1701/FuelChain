'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { canDispatchFuel, homeForRole } from '@/lib/role-access';
import { roleLabel } from '@/lib/es-labels';
import { useDispatchOptions } from '@/lib/use-dispatch-options';

type SimResult = {
  note?: string;
  steps?: string[];
  tokenId?: string;
  deepLinkPath?: string;
  issued?: { data?: { tokenId?: string; deepLinkPath?: string } };
};

export default function SimularPage() {
  const { authHeaders, user } = useAuth();
  const { batches, stations } = useDispatchOptions(authHeaders);
  const [stationCode, setStationCode] = useState('ST-CBB-01');
  const [batchCode, setBatchCode] = useState('FC-BO-2026-000182');
  const [density, setDensity] = useState('0.745');
  const [temperature, setTemperature] = useState('22');
  const [water, setWater] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);
  const [pending, start] = useTransition();
  const canRun = canDispatchFuel(user?.role);
  const cisternCode = user?.cisternCode ?? 'CIS-CBB-01';

  useEffect(() => {
    if (user?.stationCode) setStationCode(user.stationCode);
  }, [user?.stationCode]);

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

  function run() {
    if (!canRun) return;
    start(async () => {
      setLog(null);
      setResult(null);
      try {
        const res = await fetch(`${API_URL}/demo/simulate-cbba-delivery`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            batchCode,
            stationCode,
            cisternCode,
            volumeLiters: 8000,
            loadDensity: Number(density),
            loadTemperature: Number(temperature),
            loadWaterDetected: water,
          }),
        });
        if (!res.ok) throw await errorFromResponse(res);
        const json = (await res.json()) as SimResult;
        setResult(json);
        setLog(json.note ?? 'Viaje simulado — falta aceptación de estación');
      } catch (e) {
        setLog(friendlyError(e, 'Falló la simulación'));
      }
    });
  }

  if (user && !canRun) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-black">Simular</h1>
        <p className="text-[var(--mute)]">
          Esta pantalla es para chofer. Tu rol ({roleLabel(user.role)}) no
          despacha combustible.
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

  const tokenId =
    result?.tokenId ?? result?.issued?.data?.tokenId ?? null;
  const deepLink =
    result?.deepLinkPath ??
    result?.issued?.data?.deepLinkPath ??
    (tokenId ? `/q/${tokenId}` : null);

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">Chofer · atajo DEMO</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">
          Simular viaje
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          Atajo DEMO: emite el QR con litros y calidad de carga. Después
          registrá{' '}
          <Link href="/tramos" className="text-[var(--diesel)] underline">
            tramos del viaje
          </Link>
          ; la estación verifica al recibir. Cisterna:{' '}
          <strong>{cisternCode}</strong>.
        </p>
      </header>

      <div className="fc-sheet grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          Lote
          <select
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
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
        <label className="block text-sm">
          Estación destino
          <select
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
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
        <label className="block text-sm">
          Densidad
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Temp. °C
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={water}
            onChange={(e) => setWater(e.target.checked)}
          />
          Agua detectada en carga
        </label>
        <div className="md:col-span-2">
          <button
            type="button"
            disabled={pending}
            onClick={run}
            className="w-full bg-[var(--diesel)] px-4 py-3 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
          >
            {pending ? 'Emitiendo…' : 'Emitir viaje (QR)'}
          </button>
        </div>
      </div>

      {log && (
        <p
          className={`text-sm ${
            result ? 'text-[var(--seal)]' : 'text-[var(--alarm)]'
          }`}
        >
          {log}
        </p>
      )}

      {result?.steps && (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--mute)]">
          {result.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}

      {tokenId && deepLink && (
        <p className="text-sm">
          Bastón{' '}
          <Link href={deepLink} className="text-[var(--diesel)] underline">
            {tokenId}
          </Link>
          {' — '}
          entrá como estación para aceptar.
        </p>
      )}

      <p className="text-sm text-[var(--mute)]">
        Paso a paso:{' '}
        <Link href="/verify" className="underline">
          Registrar viaje
        </Link>
        .
      </p>
    </div>
  );
}
