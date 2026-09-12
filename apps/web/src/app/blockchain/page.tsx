import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { labelEs } from '@/lib/es-labels';
import { LiveAnchorPanel } from '@/components/live-anchor-panel';

export const dynamic = 'force-dynamic';

type AnchorsResponse = {
  note: string;
  data: Array<{
    id: string;
    eventKind: string;
    dataHash: string;
    transactionHash: string | null;
    blockNumber: string | null;
    timestamp: string;
    status: string;
    explorerUrl: string | null;
    batch: { batchCode: string };
  }>;
};

export default async function BlockchainPage() {
  let rows: AnchorsResponse['data'] = [];
  let note = '';
  let error: string | null = null;
  try {
    const res = await apiGet<AnchorsResponse>('/blockchain/anchors');
    rows = res.data;
    note = res.note;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error de API';
  }

  return (
    <div className="fc-page">
      <header className="fc-page-header">
        <h1 className="fc-title">
          Evidencia en cadena
        </h1>
        <p className="fc-lede">
          Registro a prueba de manipulación de eventos y hashes. No sustituye la
          base operacional ni demuestra existencia física del combustible. {note}
        </p>
      </header>

      <LiveAnchorPanel />

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      <section className="fc-surface overflow-x-auto">
        <table className="fc-table min-w-[880px]">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Evento</th>
              <th>Hash</th>
              <th>Bloque</th>
              <th>Fecha</th>
              <th>Transacción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link
                    href={`/batches/${r.batch.batchCode}`}
                    className="fc-batch-code text-[var(--diesel)]"
                  >
                    {r.batch.batchCode}
                  </Link>
                </td>
                <td>{labelEs(r.eventKind)}</td>
                <td className="max-w-[160px] truncate text-[var(--mute)]">
                  {r.dataHash}
                </td>
                <td className="tabular-nums">{r.blockNumber ?? '—'}</td>
                <td className="text-[var(--mute)]">
                  {new Date(r.timestamp).toLocaleString('es-BO')}
                </td>
                <td className="max-w-[180px] truncate">
                  {r.explorerUrl ? (
                    <a
                      href={r.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--diesel)] hover:underline"
                    >
                      Abrir explorador
                    </a>
                  ) : (
                    <span className="text-[var(--mute)]">
                      {r.transactionHash ?? '—'}
                    </span>
                  )}
                </td>
                <td
                  className={
                    r.status === 'CONFIRMED'
                      ? 'text-[var(--seal)]'
                      : r.status === 'FAILED'
                        ? 'text-[var(--alarm)]'
                        : r.status === 'PENDING'
                          ? 'text-[var(--diesel)]'
                          : 'text-[var(--mute)]'
                  }
                >
                  {labelEs(r.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
