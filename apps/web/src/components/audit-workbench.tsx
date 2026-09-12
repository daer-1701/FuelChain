'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { canWriteAudit } from '@/lib/role-access';
import { labelEs, roleLabel } from '@/lib/es-labels';

const STATUSES = [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'FALSE_POSITIVE',
  'CLOSED',
] as const;

export function AuditWorkbench({
  caseId,
  currentStatus,
}: {
  caseId: string;
  currentStatus: string;
}) {
  const { user, authHeaders } = useAuth();
  const router = useRouter();
  const canWrite = canWriteAudit(user?.role);
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState('');
  const [log, setLog] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!canWrite) {
    return (
      <p className="text-sm text-[var(--mute)]">
        Solo auditor (o admin) puede agregar notas o cerrar el caso. Tu rol:{' '}
        {roleLabel(user?.role) === '—' ? 'sin sesión' : roleLabel(user?.role)}.
      </p>
    );
  }

  function saveStatus() {
    start(async () => {
      setLog(null);
      try {
        const res = await fetch(`${API_URL}/audits/${caseId}/status`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw await errorFromResponse(res);
        setLog(`Estado actualizado a ${labelEs(status)}.`);
        router.refresh();
      } catch (e) {
        setLog(friendlyError(e, 'No se pudo actualizar'));
      }
    });
  }

  function addNote() {
    if (!note.trim()) return;
    start(async () => {
      setLog(null);
      try {
        const res = await fetch(`${API_URL}/audits/${caseId}/notes`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ body: note.trim() }),
        });
        if (!res.ok) throw await errorFromResponse(res);
        setNote('');
        setLog('Nota agregada.');
        router.refresh();
      } catch (e) {
        setLog(friendlyError(e, 'No se pudo agregar la nota'));
      }
    });
  }

  return (
    <section className="space-y-4 border-2 border-[var(--ink)] p-5">
      <h2 className="font-display text-xl font-bold">Trabajar el caso</h2>
      <p className="text-sm text-[var(--mute)]">
        La decisión es humana: revisá evidencia, dejá nota y cerrá o marcá
        falso positivo.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          Estado
          <select
            className="mt-1 block border border-[var(--ink)] bg-transparent px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelEs(s)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={saveStatus}
          className="bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
        >
          Guardar estado
        </button>
      </div>
      <label className="block text-sm">
        Nota de auditoría
        <textarea
          className="mt-1 min-h-[88px] w-full border border-[var(--ink)] bg-transparent px-3 py-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Qué se revisó, qué se decidió…"
        />
      </label>
      <button
        type="button"
        disabled={pending || !note.trim()}
        onClick={addNote}
        className="border-2 border-[var(--ink)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        Agregar nota
      </button>
      {log && <p className="text-sm">{log}</p>}
    </section>
  );
}
