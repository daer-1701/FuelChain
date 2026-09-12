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
} from '@/components/dashboard-widgets';
import { MetricRail, OpsPageHeader, StatusPill } from '@/components/ops';
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
      <div className="fc-page">
        <h1 className="fc-title">Tu panel</h1>
        <p className="fc-lede">{roleBlurb(user.role)}</p>
        <Link href={home} className="fc-btn fc-btn-ink">
          Ir a {home}
        </Link>
      </div>
    );
  }

  return (
    <div className="fc-page">
      <OpsPageHeader
        stamp="Resumen operativo DEMO"
        title="Vista agregada"
        lede={
          user && isAppRole(user.role)
            ? roleBlurb(user.role)
            : 'Vista agregada de lotes, riesgo y discrepancias. No es el panel operativo del chofer ni de la estación.'
        }
      />

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
          <MetricRail
            items={[
              {
                label: 'Volumen total',
                value: `${Math.round(Number(data.kpis.totalVolumeLiters)).toLocaleString('es-BO')} L`,
              },
              {
                label: 'Riesgo alto',
                value: String(data.kpis.highRisk),
                tone: data.kpis.highRisk > 0 ? 'danger' : 'ok',
              },
              {
                label: 'Discrepancias',
                value: String(data.kpis.discrepancies),
                tone: data.kpis.discrepancies > 0 ? 'warn' : 'ok',
              },
              {
                label: 'Lotes recientes',
                value: String(data.recentBatches.length),
                tone: 'info',
              },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            {data.kpis.highRisk > 0 && (
              <StatusPill label="Atención riesgo" tone="danger" pulse />
            )}
            {data.kpis.discrepancies > 0 && (
              <StatusPill label="Hay discrepancias" tone="warn" />
            )}
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <RecentBatches batches={data.recentBatches} />
            <RecentAnomalies anomalies={data.recentAnomalies} />
          </div>
        </>
      )}
    </div>
  );
}
