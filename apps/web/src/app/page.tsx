'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import {
  homeForRole,
  isAppRole,
  roleBlurb,
} from '@/lib/role-access';
import {
  RecentAnomalies,
  RecentBatches,
  StatStrip,
  VolumeHero,
} from '@/components/dashboard-widgets';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { friendlyError } from '@/lib/api-error';
import type { DashboardKpis } from '@/lib/types';

/**
 * Resumen global: solo tiene sentido para roles de supervisión / importación.
 * Otros roles se redirigen a su home (AuthGate también bloquea /).
 */
export default function DashboardPage() {
  const { user, ready } = useAuth();
  const [data, setData] = useState<DashboardKpis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showKpis =
    !user ||
    user.role === 'ADMIN' ||
    user.role === 'IMPORTER' ||
    user.role === 'AUDITOR' ||
    user.role === 'VERIFIER';

  useEffect(() => {
    if (!ready || !showKpis) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/dashboard/kpis`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as DashboardKpis;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(friendlyError(e, 'Servicio no disponible'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, showKpis]);

  if (!ready) {
    return <p className="text-[var(--mute)]">Cargando…</p>;
  }

  if (user && !showKpis) {
    const home = homeForRole(user.role);
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-black">Tu panel</h1>
        <p className="text-[var(--mute)]">{roleBlurb(user.role)}</p>
        <Link
          href={home}
          className="inline-block bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)]"
        >
          Ir a {home}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {user && isAppRole(user.role) && (
        <p className="text-sm text-[var(--mute)]">{roleBlurb(user.role)}</p>
      )}
      {error && (
        <div
          role="alert"
          className="border border-[var(--alarm)] bg-[var(--alarm-soft)] px-4 py-3 text-sm"
        >
          No se pudo cargar el resumen ({error}). Arrancá el servicio en el puerto
          3001 e intentá de nuevo.
        </div>
      )}
      {data && (
        <>
          <div className="fc-sheet space-y-6">
            <p className="max-w-md text-sm leading-relaxed text-[var(--mute)]">
              Vista agregada de lotes, riesgo y discrepancias. No es el panel
              operativo del chofer ni de la estación.
            </p>
            <VolumeHero
              totalVolumeLiters={data.kpis.totalVolumeLiters}
              highRisk={data.kpis.highRisk}
              discrepancies={data.kpis.discrepancies}
            />
          </div>
          <StatStrip kpis={data.kpis} />
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <RecentBatches batches={data.recentBatches} />
            <RecentAnomalies anomalies={data.recentAnomalies} />
          </div>
        </>
      )}
    </div>
  );
}
