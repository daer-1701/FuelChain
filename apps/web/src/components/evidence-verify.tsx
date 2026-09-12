'use client';

import { useState, useTransition } from 'react';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { labelEs } from '@/lib/es-labels';

type VerifyPayload = {
  note: string;
  data: {
    verdict: 'MATCH' | 'MISMATCH';
    onChainStatus: string;
    recomputedHash: string;
    storedHash: string | null;
    transactionHash: string | null;
    blockNumber: string | null;
    contractAddress: string | null;
    network: string;
  };
};

export function EvidenceVerify({
  custodyEventId,
}: {
  custodyEventId: string;
}) {
  const [result, setResult] = useState<VerifyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function verify() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `${API_URL}/blockchain/verify-evidence/${encodeURIComponent(custodyEventId)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw await errorFromResponse(res, 'No se pudo verificar.');
        setResult((await res.json()) as VerifyPayload);
      } catch (e) {
        setError(friendlyError(e, 'No se pudo verificar'));
      }
    });
  }

  return (
    <div className="mt-3 border-t border-[var(--rail)]/35 pt-3">
      <button
        type="button"
        onClick={verify}
        disabled={pending}
        className="border border-[var(--ink)] px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
      >
        {pending ? 'Recalculando…' : 'Recalcular hash'}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[var(--alarm)]">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-3 space-y-2 text-sm">
          <p
            className={
              result.data.verdict === 'MATCH'
                ? 'font-semibold text-[var(--seal)]'
                : 'font-semibold text-[var(--alarm)]'
            }
          >
            {labelEs(result.data.verdict)}
          </p>
          <p className="text-[var(--mute)]">{result.note}</p>
          <p className="text-[var(--mute)]">
            Cadena: {labelEs(result.data.onChainStatus)} · {result.data.network}
          </p>
          <p className="break-all font-mono text-xs text-[var(--mute)]">
            {result.data.recomputedHash}
          </p>
        </div>
      )}
    </div>
  );
}
