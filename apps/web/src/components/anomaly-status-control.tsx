'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { canResolveAnomaly } from '@/lib/role-access';

const STATUSES = [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'FALSE_POSITIVE',
] as const;

export function AnomalyStatusControl({
  anomalyId,
  currentStatus,
}: {
  anomalyId: string;
  currentStatus: string;
}) {
  const { user, authHeaders } = useAuth();
  const router = useRouter();
  const canResolve = canResolveAnomaly(user?.role);
  const [status, setStatus] = useState(currentStatus);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!canResolve) {
    return <span className="capitalize text-[var(--mute)]">{currentStatus}</span>;
  }

  function save() {
    start(async () => {
      setErr(null);
      try {
        const res = await fetch(`${API_URL}/anomalies/${anomalyId}/status`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw await errorFromResponse(res);
        router.refresh();
      } catch (e) {
        setErr(friendlyError(e, 'No se pudo guardar el estado'));
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        className="border border-[var(--ink)] bg-transparent px-2 py-1 text-xs"
        value={status}
        disabled={pending}
        onChange={(e) => setStatus(e.target.value)}
        onBlur={save}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {status !== currentStatus && (
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="text-left text-xs font-semibold text-[var(--diesel)] underline"
        >
          Guardar
        </button>
      )}
      {err && <span className="text-xs text-[var(--alarm)]">{err}</span>}
    </div>
  );
}
