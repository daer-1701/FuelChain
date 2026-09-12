import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { labelEs } from '@/lib/es-labels';
import { LiveAnchorPanel } from '@/components/live-anchor-panel';
import {
  MetricRail,
  OpsPageHeader,
  StatusPill,
  anchorToneFrom,
} from '@/components/ops';

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

  const confirmed = rows.filter((r) => r.status === 'CONFIRMED').length;
  const pending = rows.filter((r) => r.status === 'PENDING').length;
  const failed = rows.filter((r) => r.status === 'FAILED').length;

  return (
    <div className="fc-page">
      <OpsPageHeader
        stamp="Integridad del registro (HSK)"
        title="Evidencia en cadena"
        lede={
          <>
            Acá no ves litros ni el mapa del viaje. Ves si el{' '}
            <strong>evento de recepción</strong> quedó anclado: un hash +
            transacción verificable. No prueba el litro físico.
            {note ? (
              <>
                {' '}
                <span className="fc-meta">{note}</span>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <Link href="/supervision" className="fc-btn fc-btn-ghost !text-xs">
              Movimientos
            </Link>
            <Link href="/tramos" className="fc-btn fc-btn-ghost !text-xs">
              Tramos GPS
            </Link>
          </>
        }
      />

      <MetricRail
        items={[
          {
            label: 'Anclas',
            value: String(rows.length),
            hint: 'Eventos registrados',
          },
          {
            label: 'Confirmadas',
            value: String(confirmed),
            tone: confirmed > 0 ? 'ok' : 'mute',
          },
          {
            label: 'Pendientes',
            value: String(pending),
            tone: pending > 0 ? 'warn' : 'mute',
            hint: pending > 0 ? 'Chain o reintento' : undefined,
          },
          {
            label: 'Fallidas',
            value: String(failed),
            tone: failed > 0 ? 'danger' : 'ok',
          },
        ]}
      />

      <LiveAnchorPanel />

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      <section className="overflow-x-auto border-2 border-[var(--ink)]">
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
              <tr key={r.id} className="fc-ops-rise">
                <td>
                  <Link
                    href={`/batches/${r.batch.batchCode}`}
                    className="fc-batch-code text-[var(--diesel)]"
                  >
                    {r.batch.batchCode}
                  </Link>
                </td>
                <td>{labelEs(r.eventKind)}</td>
                <td className="max-w-[160px] truncate font-mono text-xs text-[var(--mute)]">
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
                <td>
                  <StatusPill
                    label={labelEs(r.status)}
                    tone={anchorToneFrom(r.status)}
                    pulse={r.status === 'PENDING'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error ? (
          <p className="px-4 py-8 text-sm text-[var(--mute)]">
            Todavía no hay anclas. Aparecen cuando una recepción queda sellada
            en HSK.
          </p>
        ) : null}
      </section>
    </div>
  );
}
