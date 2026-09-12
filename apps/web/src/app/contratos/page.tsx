'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { friendlyError } from '@/lib/api-error';
import { canManageContracts, homeForRole } from '@/lib/role-access';

type ContractRow = {
  id: string;
  title: string;
  status: string;
  batchCode: string;
  product: string;
  cisternCode: string;
  driverName: string;
  stationCode: string;
  stationName: string;
  loadedLiters: number;
  receivedLiters: number | null;
  qualityOk: boolean;
  loadedAt: string;
  deliveredAt: string | null;
  batonTokenId: string | null;
  parties: { station: string; driver: string; carrier: string };
};

export default function ContratosPage() {
  const { user, ready, authHeaders } = useAuth();
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const allowed = canManageContracts(user?.role);

  useEffect(() => {
    if (!ready || !user || !allowed) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/stations/contracts`, {
          headers: authHeaders(),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as {
          note?: string;
          data: ContractRow[];
        };
        if (!cancelled) {
          setRows(json.data);
          setNote(json.note ?? '');
        }
      } catch (e) {
        if (!cancelled) {
          setError(friendlyError(e, 'No se pudieron cargar los contratos'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user, allowed, authHeaders]);

  if (!ready) {
    return <p className="text-[var(--mute)]">Cargando…</p>;
  }

  if (!user || !allowed) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-black">Contratos</h1>
        <p className="text-[var(--mute)]">
          Los contratos de entrega son entre surtidor y chofer.
        </p>
        {user && (
          <Link href={homeForRole(user.role)} className="underline">
            Ir a tu panel
          </Link>
        )}
      </div>
    );
  }

  const isStation = user.role === 'STATION_STAFF';

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">
          {isStation ? 'Estación' : 'Chofer'} · contratos DEMO
        </p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight">
          Contratos de entrega
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          Acuerdo operativo entre el surtidor y el chofer por cada despacho
          (litros, cisterna, destino). {note}
        </p>
      </header>

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      {!error && rows.length === 0 && (
        <p className="text-[var(--mute)]">
          Todavía no hay entregas para armar contratos DEMO.
        </p>
      )}

      <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
        {rows.map((c) => (
          <li key={c.id} className="space-y-3 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold">{c.title}</p>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  {c.parties.driver} · {c.parties.carrier} ↔ {c.parties.station}
                </p>
              </div>
              <span className="fc-stamp">{c.status}</span>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2 md:grid-cols-4">
              <div>
                <dt className="text-[var(--mute)]">Producto / lote</dt>
                <dd>
                  {c.product} ·{' '}
                  <span className="fc-batch-code text-[var(--diesel)]">
                    {c.batchCode}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mute)]">Cargado</dt>
                <dd className="tabular-nums">
                  {Math.round(c.loadedLiters).toLocaleString('es-BO')} L
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mute)]">Recibido</dt>
                <dd className="tabular-nums">
                  {c.receivedLiters != null
                    ? `${Math.round(c.receivedLiters).toLocaleString('es-BO')} L`
                    : 'Pendiente'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mute)]">Calidad viaje</dt>
                <dd>{c.qualityOk ? 'OK DEMO' : 'Alerta DEMO'}</dd>
              </div>
            </dl>
            {c.batonTokenId && c.status !== 'DELIVERED' && (
              <Link
                href={`/q/${c.batonTokenId}`}
                className="inline-block text-sm font-semibold text-[var(--diesel)] underline"
              >
                Abrir bastón QR
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
