'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { explorerTxUrl } from '@/lib/explorer';
import { canAnchorEvidence } from '@/lib/role-access';
import { roleLabel } from '@/lib/es-labels';

type ChainStatus = {
  live: boolean;
  rpcReachable: boolean;
  contractAddress: string | null;
  hasPrivateKey: boolean;
  blockNumber: string | null;
  onChainAnchorCount: string | null;
  chainId: number | null;
  network?: string;
  note: string;
  error: string | null;
};

type AnchorResult = {
  live: boolean;
  note: string;
  data: {
    transactionHash: string | null;
    blockNumber: string | null;
    dataHash: string;
    eventKind: string;
    batch: { batchCode: string };
  };
};

const DEFAULT_BATCH = 'FC-BO-2026-000184';
const DEFAULT_EVENT = 'AnomalyRegistered';

export function LiveAnchorPanel({
  defaultBatchCode = DEFAULT_BATCH,
}: {
  defaultBatchCode?: string;
}) {
  const router = useRouter();
  const { authHeaders, user } = useAuth();
  const canAnchor = canAnchorEvidence(user?.role);
  const [status, setStatus] = useState<ChainStatus | null>(null);
  const [batchCode, setBatchCode] = useState(defaultBatchCode);
  const [eventKind, setEventKind] = useState(DEFAULT_EVENT);
  const [note, setNote] = useState('Ancla en vivo para el jurado');
  const [result, setResult] = useState<AnchorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/blockchain/status`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as ChainStatus;
        if (!cancelled) setStatus(json);
      } catch (e) {
        if (!cancelled) {
          setStatus({
            live: false,
            rpcReachable: false,
            contractAddress: null,
            hasPrivateKey: false,
            blockNumber: null,
            onChainAnchorCount: null,
            chainId: null,
            note: 'No se pudo consultar el estado de la cadena.',
            error: e instanceof Error ? e.message : 'error',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result]);

  function onAnchor() {
    if (!canAnchor) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/blockchain/anchor`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ batchCode, eventKind, note }),
        });
        if (!res.ok) throw await errorFromResponse(res, 'No se pudo anclar.');
        const json = (await res.json()) as AnchorResult;
        setResult(json);
        router.refresh();
      } catch (e) {
        setError(friendlyError(e, 'Fallo al anclar'));
      }
    });
  }

  const ready = Boolean(status?.live);

  if (user && !canAnchor) {
    return (
      <section className="border-2 border-[var(--ink)] bg-[var(--paper)] p-5">
        <h2 className="font-display text-xl font-bold">Evidencia en cadena</h2>
        <p className="mt-2 text-sm text-[var(--mute)]">
          Registrar en la cadena es trabajo de auditor / importador / admin. Tu
          rol ({roleLabel(user.role)}) solo consulta el historial abajo.
        </p>
      </section>
    );
  }

  return (
    <section className="border-2 border-[var(--ink)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">
            Anclar evidencia ahora
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--mute)]">
            Escribe un evento en la cadena y guarda el hash de la transacción.
            Hash verificable. No prueba litros físicos ni que no hubo robo.
          </p>
        </div>
        <span className="fc-stamp text-[var(--diesel)]">Demo en vivo</span>
      </div>

      <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <StatusLine
          ok={Boolean(status?.rpcReachable)}
          label={
            status?.rpcReachable
              ? `Nodo ok · bloque ${status.blockNumber ?? '—'}`
              : 'Nodo sin conexión'
          }
        />
        <StatusLine
          ok={Boolean(status?.contractAddress)}
          label={
            status?.contractAddress
              ? `Contrato ${status.contractAddress.slice(0, 10)}…`
              : 'Sin contrato'
          }
        />
        <StatusLine
          ok={Boolean(status?.network || status?.chainId)}
          label={
            status?.network
              ? `Red ${status.network}`
              : status?.chainId
                ? `Cadena ${status.chainId}`
                : 'Red desconocida'
          }
        />
        <StatusLine
          ok={Boolean(status?.hasPrivateKey)}
          label={
            status?.hasPrivateKey
              ? 'Clave de escritura lista'
              : 'Sin clave privada'
          }
        />
        {status?.onChainAnchorCount != null && (
          <StatusLine
            ok
            label={`${status.onChainAnchorCount} anclas en cadena`}
          />
        )}
      </ul>

      {!ready && (
        <p className="mt-4 text-sm text-[var(--mute)]">
          {status?.note ?? 'Preparando…'} Si usás localhost, arrancá Hardhat y
          desplegá. Si usás HSK, revisá la URL del nodo (guía demo).
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-[var(--mute)]">
          Lote
          <input
            className="fc-input mt-1"
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
          />
        </label>
        <label className="block text-sm text-[var(--mute)]">
          Evento
          <select
            className="fc-input mt-1"
            value={eventKind}
            onChange={(e) => setEventKind(e.target.value)}
          >
            <option value="AnomalyRegistered">
              Discrepancia registrada
            </option>
            <option value="MeasurementAnchored">Medición anclada</option>
            <option value="CustodyEventRegistered">
              Custodia registrada
            </option>
            <option value="DocumentHashRegistered">
              Hash de documento
            </option>
            <option value="BatchCreated">Lote creado</option>
          </select>
        </label>
        <label className="block text-sm text-[var(--mute)]">
          Nota
          <input
            className="fc-input mt-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      <button
        type="button"
        disabled={pending || !ready}
        onClick={onAnchor}
        className="fc-btn mt-5"
      >
        {pending ? 'Anclando…' : 'Anclar ahora'}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[var(--alarm)]">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 border border-[var(--seal)] bg-[var(--seal-soft)] p-4 text-sm">
          <p className="font-semibold text-[var(--seal)]">Ancla confirmada</p>
          <p className="mt-2 text-[var(--mute)]">{result.note}</p>
          <dl className="mt-3 space-y-1 font-mono text-xs text-[var(--ink)]">
            <div>
              <dt className="inline text-[var(--mute)]">tx · </dt>
              <dd className="inline break-all">{result.data.transactionHash}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--mute)]">bloque · </dt>
              <dd className="inline">{result.data.blockNumber}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--mute)]">huella · </dt>
              <dd className="inline break-all">{result.data.dataHash}</dd>
            </div>
          </dl>
          {explorerTxUrl(result.data.transactionHash) && (
            <a
              href={explorerTxUrl(result.data.transactionHash)!}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-[var(--diesel)] hover:underline"
            >
              Ver en explorador
            </a>
          )}
        </div>
      )}
    </section>
  );
}

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={`border-l-2 pl-3 ${
        ok ? 'border-[var(--seal)] text-[var(--seal)]' : 'border-[var(--alarm)] text-[var(--alarm)]'
      }`}
    >
      {label}
    </li>
  );
}
