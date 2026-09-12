'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { friendlyError } from '@/lib/api-error';
import { labelEs } from '@/lib/es-labels';
import { homeForRole } from '@/lib/role-access';

type SettlementRow = {
  id: string;
  status: string;
  liters: number;
  ratePerLiter: number;
  amountBob: number;
  currency: string;
  batchCode: string;
  product: string;
  cisternCode: string;
  stationCode: string;
  stationName: string;
  driverName: string;
  batonTokenId: string | null;
  deliveredAt: string | null;
  paidAt: string | null;
  evidenceNote: string | null;
};

export default function LiquidacionesPage() {
  const { user, ready, authHeaders } = useAuth();
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const canPay =
    user?.role === 'STATION_STAFF' || user?.role === 'ADMIN';

  async function load() {
    const res = await fetch(`${API_URL}/settlements`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { note?: string; data: SettlementRow[] };
    setRows(json.data);
    setNote(json.note ?? '');
  }

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(friendlyError(e, 'No se pudieron cargar liquidaciones'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.id]);

  function pay(id: string) {
    start(async () => {
      setMsg(null);
      try {
        const res = await fetch(`${API_URL}/settlements/${id}/pay`, {
          method: 'POST',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { note?: string };
        setMsg(json.note ?? 'Liquidación marcada como pagada.');
        await load();
      } catch (e) {
        setMsg(friendlyError(e, 'No se pudo marcar el pago'));
      }
    });
  }

  if (!ready) {
    return <p className="text-[var(--mute)]">Cargando…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-black">Liquidaciones</h1>
        <Link href="/login" className="underline">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="fc-stamp text-[var(--mute)]">
          {user.role === 'TRANSPORTER' ? 'Chofer' : 'Estación'} · feria Ethereum
        </p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight">
          Liquidaciones al chofer
        </h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          Al completar la ruta (estación acepta el QR), se genera una
          liquidación DEMO en bolivianos. No mueve dinero real; sirve para el
          pitch de ciclo cerrado. {note}
        </p>
      </header>

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}
      {msg && <p className="text-sm text-[var(--seal)]">{msg}</p>}

      {rows.length === 0 && !error && (
        <p className="text-[var(--mute)]">
          Todavía no hay liquidaciones. Completá una entrega estación ← chofer.
        </p>
      )}

      <ul className="divide-y divide-[var(--rail)]/40 border-y-2 border-[var(--ink)]">
        {rows.map((r) => (
          <li key={r.id} className="space-y-3 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold">
                  {r.cisternCode} → {r.stationName || r.stationCode}
                </p>
                <p className="mt-1 text-sm text-[var(--mute)]">
                  {r.driverName} ·{' '}
                  <span className="fc-batch-code text-[var(--diesel)]">
                    {r.batchCode}
                  </span>{' '}
                  · {r.product}
                </p>
              </div>
              <span className="fc-stamp">{labelEs(r.status)}</span>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[var(--mute)]">Litros</dt>
                <dd className="tabular-nums">
                  {Math.round(r.liters).toLocaleString('es-BO')} L
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mute)]">Tarifa DEMO</dt>
                <dd className="tabular-nums">
                  {r.ratePerLiter.toLocaleString('es-BO')} Bs/L
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mute)]">Monto</dt>
                <dd className="font-display text-xl font-black tabular-nums">
                  {r.amountBob.toLocaleString('es-BO', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  Bs
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              {canPay && r.status === 'PENDING' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => pay(r.id)}
                  className="bg-[var(--ink)] px-3 py-1.5 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
                >
                  Marcar pagada
                </button>
              )}
              {r.batonTokenId && (
                <Link
                  href={`/q/${r.batonTokenId}`}
                  className="text-sm font-semibold text-[var(--diesel)] underline"
                >
                  Ver bastón
                </Link>
              )}
              <Link
                href={homeForRole(user.role)}
                className="text-sm text-[var(--mute)] underline"
              >
                Volver
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
