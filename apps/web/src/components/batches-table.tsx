import Link from 'next/link';
import {
  formatStatus,
  formatVolume,
  riskClass,
  type BatchesList,
} from '@/lib/types';
import { riskLabel } from '@/lib/es-labels';

export function BatchesTable({ list }: { list: BatchesList }) {
  return (
    <section className="fc-surface overflow-hidden">
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
              <tr key={b.id}>
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
                <td className="tabular-nums">
                  {formatVolume(b.declaredVolumeLiters)}
                </td>
                <td className="capitalize text-[var(--mute)]">
                  {formatStatus(b.status)}
                </td>
                <td className="capitalize text-[var(--mute)]">
                  {formatStatus(b.qualityStatus)}
                </td>
                <td className={`font-medium ${riskClass(b.riskLevel)}`}>
                  {riskLabel(b.riskLevel)} · {b.riskScore}
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
      <div className="border-t border-[var(--rail)]/40 px-4 py-3 text-sm text-[var(--mute)]">
        {list.meta.total} lotes · página {list.meta.page} de {list.meta.pageCount}
      </div>
    </section>
  );
}
