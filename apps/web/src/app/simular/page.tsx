'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { canDispatchFuel, homeForRole } from '@/lib/role-access';
import { CbbaStationsExplorer } from '@/components/cbba-stations-explorer';
import type { PublicStation } from '@/components/station-types';

/** Lotes del seed DEMO — evita 404 por códigos inventados. */
const DEMO_BATCHES = [
  {
    code: 'FC-BO-2026-000182',
    label: 'FC-BO-2026-000182 · Diésel (en tránsito CBBA)',
  },
  {
    code: 'FC-BO-2026-000184',
    label: 'FC-BO-2026-000184 · Gasolina (auditoría)',
  },
  {
    code: 'FC-BO-2026-000181',
    label: 'FC-BO-2026-000181 · Gasolina (completado)',
  },
] as const;

type SimResult = {
  note?: string;
  steps?: string[];
  issued?: { data?: { tokenId?: string; deepLinkPath?: string } };
  accepted?: { data?: { status?: string } };
  map?: { data: PublicStation[]; note?: string };
};

export default function SimularPage() {
  const { authHeaders, user } = useAuth();
  const [stationCode, setStationCode] = useState('ST-CBB-01');
  const [batchCode, setBatchCode] = useState<string>(DEMO_BATCHES[0].code);
  const [log, setLog] = useState<string | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);
  const [pending, start] = useTransition();
  const canRun = canDispatchFuel(user?.role);
  const cisternCode = user?.cisternCode ?? 'CIS-CBB-01';

  useEffect(() => {
    if (user?.stationCode) setStationCode(user.stationCode);
  }, [user?.stationCode]);

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
          }),
        });
        if (!res.ok) throw await errorFromResponse(res);
        const json = (await res.json()) as SimResult;
        setResult(json);
        setLog(json.note ?? 'Simulación OK');
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
          Esta pantalla es para chofer. Tu rol ({user.role}) no despacha
          combustible.
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
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">Chofer · atajo DEMO</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">
          Simular entrega
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          Atajo DEMO: registrás el viaje (QR) y la recepción en la estación de
          una sola vez. Cisterna: <strong>{cisternCode}</strong>. Sesión:{' '}
          <strong>{user?.name}</strong>.
        </p>
      </header>

      <div className="fc-sheet grid gap-4 md:grid-cols-3">
        <label className="block text-sm md:col-span-1">
          Lote DEMO
          <select
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
          >
            {DEMO_BATCHES.map((b) => (
              <option key={b.code} value={b.code}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm md:col-span-1">
          Estación destino
          <select
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
            value={stationCode}
            onChange={(e) => setStationCode(e.target.value)}
          >
            <option value="ST-CBB-01">ST-CBB-01 Cala Cala</option>
            <option value="ST-CBB-02">ST-CBB-02 Quillacollo</option>
            <option value="ST-CBB-03">ST-CBB-03 Sacaba</option>
            <option value="ST-CBB-05">ST-CBB-05 Vinto</option>
            <option value="ST-CBB-06">ST-CBB-06 Av. Petrolera</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            disabled={pending}
            onClick={run}
            className="w-full bg-[var(--diesel)] px-4 py-3 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
          >
            {pending ? 'Simulando…' : 'Simular entrega ahora'}
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

      {result?.issued?.data?.tokenId && (
        <p className="text-sm">
          Bastón{' '}
          <Link
            href={result.issued.data.deepLinkPath ?? '#'}
            className="text-[var(--diesel)] underline"
          >
            {result.issued.data.tokenId}
          </Link>{' '}
          · estado aceptación: {result.accepted?.data?.status ?? '—'}
        </p>
      )}

      {result?.map?.data && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Mapa actualizado</h2>
          <CbbaStationsExplorer stations={result.map.data} />
        </section>
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
