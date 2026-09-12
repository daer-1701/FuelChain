import Link from 'next/link';
import { StatusPill, riskToneFrom } from '@/components/ops';
import {
  formatStatus,
  formatVolume,
  type BatchesList,
} from '@/lib/types';
import { riskLabel } from '@/lib/es-labels';

function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'AUDIT_REQUIRED') return 'danger' as const;
  if (s === 'IN_TRANSIT') return 'warn' as const;
  if (s === 'COMPLETED' || s === 'CERTIFIED') return 'ok' as const;
  return 'mute' as const;
}

export function BatchesTable({ list }: { list: BatchesList }) {
  return (
    <section className="overflow-hidden border-2 border-[var(--ink)]">
      <div className="overflow-x-auto">
        <table className="fc-table min-w-[920px]">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Producto</th>
              <th>Origen</th>
              <th>Volumen</th>
              <th>Estado</th>
              <th>Calidad</th>
              <th>Riesgo</th>
              <th>Ubicación</th>
              <th>Último evento</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((b) => (
              <tr key={b.id} className="fc-ops-rise">
                <td>
                  <Link
                    href={`/batches/${encodeURIComponent(b.batchCode)}`}
                    className="fc-batch-code text-[var(--diesel)] hover:underline"
                  >
                    {b.batchCode}
                  </Link>
                </td>
                <td>{b.product}</td>
                <td>{b.originCountry}</td>
                <td className="tabular-nums font-semibold">
                  {formatVolume(b.declaredVolumeLiters)}
                </td>
                <td>
                  <StatusPill
                    label={formatStatus(b.status)}
                    tone={statusTone(b.status)}
                    pulse={b.status === 'AUDIT_REQUIRED'}
                  />
                </td>
                <td className="capitalize text-[var(--mute)]">
                  {formatStatus(b.qualityStatus)}
                </td>
                <td>
                  <StatusPill
                    label={`${riskLabel(b.riskLevel)} · ${b.riskScore}`}
                    tone={riskToneFrom(b.riskLevel)}
                  />
                </td>
                <td className="max-w-[160px] truncate text-[var(--mute)]">
                  {b.currentLocation ?? '—'}
                </td>
                <td className="capitalize text-[var(--mute)]">
                  {b.lastEvent ? formatStatus(b.lastEvent.eventType) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[var(--ink)] px-4 py-3 text-sm text-[var(--mute)]">
        {list.meta.total} lotes · página {list.meta.page} de {list.meta.pageCount}
      </div>
    </section>
  );
}
