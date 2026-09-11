'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { CbbaStationsExplorer } from '@/components/cbba-stations-explorer';
import type { PublicStation } from '@/components/station-types';

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
  const [batchCode, setBatchCode] = useState('FC-BO-2026-000182');
  const [log, setLog] = useState<string | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);
  const [pending, start] = useTransition();

  function run() {
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
            cisternCode: 'CIS-CBB-07',
            volumeLiters: 24800,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as SimResult;
        setResult(json);
        setLog(json.note ?? 'Simulación OK');
      } catch (e) {
        setLog(e instanceof Error ? e.message : 'Falló la simulación');
      }
    });
  }

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">Simulación · Cochabamba</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">
          Cisterna → estación → mapa
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          Un clic simula el traspaso con QR (emisión + recepción) y refresca el
          semáforo del surtidor. Sesión actual:{' '}
          <strong>{user?.name}</strong> ({user?.role}).
        </p>
      </header>

      <div className="fc-sheet grid gap-4 md:grid-cols-3">
        <label className="block text-sm md:col-span-1">
          Lote
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
          />
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
            <option value="ST-CBB-05">ST-CBB-05 Vinto (vacío)</option>
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

      {log && <p className="text-sm">{log}</p>}

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
          · estado aceptación:{' '}
          {result.accepted?.data?.status ?? '—'}
        </p>
      )}

      {result?.map?.data && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Mapa actualizado</h2>
          <CbbaStationsExplorer stations={result.map.data} />
        </section>
      )}

      <p className="text-sm text-[var(--mute)]">
        También podés hacerlo paso a paso en{' '}
        <Link href="/verify" className="underline">
          QR custodia
        </Link>{' '}
        o ver el mapa en{' '}
        <Link href="/mapa" className="underline">
          /mapa
        </Link>
        .
      </p>
    </div>
  );
}
