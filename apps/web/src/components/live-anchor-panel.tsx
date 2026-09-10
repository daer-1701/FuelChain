'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { API_URL } from '@/lib/api';

type ChainStatus = {
  live: boolean;
  rpcReachable: boolean;
  contractAddress: string | null;
  hasPrivateKey: boolean;
  blockNumber: string | null;
  onChainAnchorCount: string | null;
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
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/blockchain/anchor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchCode, eventKind, note }),
        });
        const json = (await res.json()) as AnchorResult & {
          message?: string | string[];
        };
        if (!res.ok) {
          const msg = Array.isArray(json.message)
            ? json.message.join(', ')
            : (json.message ?? `HTTP ${res.status}`);
          throw new Error(msg);
        }
        setResult(json);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fallo al anclar');
      }
    });
  }

  const ready = Boolean(status?.live);

  return (
    <section className="border-2 border-[var(--ink)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">
            Anclar evidencia ahora
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--mute)]">
            Escribe un evento on-chain en Hardhat local y guarda el txHash en el
            índice. No prueba litros físicos: prueba que el hash quedó
            registrado.
          </p>
        </div>
        <span className="fc-stamp text-[var(--diesel)]">Demo en vivo</span>
      </div>

      <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <StatusLine
          ok={Boolean(status?.rpcReachable)}
          label={
            status?.rpcReachable
              ? `RPC ok · bloque ${status.blockNumber ?? '—'}`
              : 'RPC offline'
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
          ok={Boolean(status?.hasPrivateKey)}
          label={status?.hasPrivateKey ? 'Clave DEMO lista' : 'Sin private key'}
        />
        {status?.onChainAnchorCount != null && (
          <StatusLine ok label={`${status.onChainAnchorCount} anclas on-chain`} />
        )}
      </ul>

      {!ready && (
        <p className="mt-4 text-sm text-[var(--mute)]">
          {status?.note ?? 'Preparando…'} Arranca el nodo Hardhat y despliega
          (ver guía demo).
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
            <option value="AnomalyRegistered">AnomalyRegistered</option>
            <option value="MeasurementAnchored">MeasurementAnchored</option>
            <option value="CustodyEventRegistered">CustodyEventRegistered</option>
            <option value="DocumentHashRegistered">DocumentHashRegistered</option>
            <option value="BatchCreated">BatchCreated</option>
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
              <dt className="inline text-[var(--mute)]">hash · </dt>
              <dd className="inline break-all">{result.data.dataHash}</dd>
            </div>
          </dl>
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
