import Link from 'next/link';
import { EvidenceVerify } from '@/components/evidence-verify';
import { LiveAnchorPanel } from '@/components/live-anchor-panel';
import { apiGet } from '@/lib/api';
import { explorerTxUrl } from '@/lib/explorer';
import { formatStatus, formatVolume, riskClass } from '@/lib/types';
import { labelEs, riskLabel } from '@/lib/es-labels';

export const dynamic = 'force-dynamic';

type Passport = {
  identification: {
    batchCode: string;
    product: string;
    declaredVolumeLiters: string | number;
    originCountry: string;
    destination: string;
    supplier: string;
    importer: string;
    status: string;
    riskScore: number;
    riskLevel: string;
    qualityStatus: string;
    currentLocation: string | null;
    createdAt: string;
  };
  custody: Array<{
    id: string;
    eventType: string;
    location: string | null;
    timestamp: string;
    measuredVolume: string | null;
    declaredVolume: string | null;
  }>;
  anomalies: Array<{ type: string; severity: string; difference: string | null }>;
  quantity: {
    declared: number;
    received: number | null;
    stored: number | null;
    sensor: number | null;
    sensorSource: string | null;
    totalGapLiters: number;
    note: string;
    steps: Array<{ key: string; label: string; liters: number | null }>;
    deltas: Array<{ from: string; to: string; differenceLiters: number }>;
    movements: Array<{
      custodyEventId: string | null;
      expectedLiters: number | null;
      receivedLiters: number | null;
      differenceLiters: number | null;
      status: string;
      note: string;
      label: string;
    }>;
  };
  transports: Array<{
    id: string;
    carrier: string;
    origin: string;
    destination: string;
    status: string;
    vehicleRef: string | null;
    vehicle?: { identifier: string; plate: string | null } | null;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    sha256Hash: string;
    blockchainTxHash: string | null;
  }>;
  quality: {
    certificates: Array<{ id: string; certificateNumber: string; status: string }>;
    labAnalyses: Array<{ id: string; status: string; laboratory: string }>;
  };
  iot: Array<{
    id: string;
    volumeLiters: string | number;
    source: string;
    timestamp: string;
  }>;
  blockchain: Array<{
    id: string;
    eventKind: string;
    eventId: string | null;
    dataHash: string;
    transactionHash: string | null;
    blockNumber: string | null;
    timestamp: string;
    status: string;
    network: string;
    contractAddress: string | null;
    chainId: number | null;
    explorerUrl?: string | null;
  }>;
};

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let passport: Passport | null = null;
  let error: string | null = null;

  try {
    passport = await apiGet<Passport>(
      `/batches/${encodeURIComponent(id)}/passport`,
    );
  } catch (e) {
    error = e instanceof Error ? e.message : 'No encontrado';
  }

  if (error || !passport) {
    return (
      <div className="space-y-4">
        <Link href="/batches" className="text-sm text-[var(--diesel)]">
          Volver a lotes
        </Link>
        <p role="alert" className="text-[var(--alarm)]">
          {error ?? 'Lote no encontrado'}
        </p>
      </div>
    );
  }

  const idn = passport.identification;
  const q = passport.quantity;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/batches"
          className="text-sm text-[var(--mute)] underline-offset-4 hover:text-[var(--diesel)] hover:underline"
        >
          Volver a lotes
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b-2 border-[var(--ink)] pb-5">
          <div>
            <p className="text-sm text-[var(--mute)]">
              Pasaporte DEMO · consignación del lote, no de un viaje
            </p>
            <h1 className="fc-batch-code mt-2 text-3xl text-[var(--diesel)] md:text-5xl">
              {idn.batchCode}
            </h1>
            <p className="mt-3 text-lg">
              {idn.product}
              <span className="text-[var(--mute)]">
                {' '}
                · {formatVolume(idn.declaredVolumeLiters)} consignados
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className={`fc-stamp ${riskClass(idn.riskLevel)}`}>
              Riesgo {riskLabel(idn.riskLevel)}
            </span>
            <p className="font-display mt-2 text-3xl font-black tabular-nums">
              {idn.riskScore}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-x-6 gap-y-5 border border-[var(--rail)]/45 bg-[var(--paper)] p-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Origen', idn.originCountry],
          ['Destino', idn.destination],
          ['Proveedor', idn.supplier],
          ['Importador', idn.importer],
          ['Estado', formatStatus(idn.status)],
          ['Calidad', formatStatus(idn.qualityStatus)],
          ['Ubicación', idn.currentLocation ?? '—'],
          ['Creado', new Date(idn.createdAt).toLocaleString('es-BO')],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-sm text-[var(--mute)]">{label}</p>
            <p className="mt-1 capitalize">{value}</p>
          </div>
        ))}
      </section>

      {(passport.transports ?? []).length > 0 && (
        <section className="fc-sheet space-y-3">
          <h2 className="font-display text-xl font-bold">Transporte del movimiento</h2>
          <p className="text-sm text-[var(--mute)]">
            Datos del vehículo / cisterna del movimiento. No es el volumen total
            del lote.
          </p>
          <ul className="space-y-3">
            {passport.transports.map((t) => (
              <li
                key={t.id}
                className="border-l-2 border-[var(--diesel)] bg-white/40 px-4 py-3 text-sm"
              >
                <p className="font-medium">
                  {t.carrier} · {formatStatus(t.status)}
                </p>
                <p className="mt-1 text-[var(--mute)]">
                  {t.origin} → {t.destination}
                </p>
                <p className="mt-1 text-[var(--mute)]">
                  Vehículo {t.vehicle?.identifier ?? t.vehicleRef ?? '—'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="fc-sheet space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">
              Reconciliación por movimiento
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--mute)]">{q.note}</p>
          </div>
          <p className="text-right text-sm">
            <span className="text-[var(--mute)]">Suma de diferencias</span>
            <span
              className={`mt-1 block font-display text-2xl font-black tabular-nums ${
                q.totalGapLiters === 0 ? 'text-[var(--seal)]' : 'text-[var(--alarm)]'
              }`}
            >
              {q.totalGapLiters > 0 ? '+' : ''}
              {q.totalGapLiters.toLocaleString('es-BO')} L
            </span>
          </p>
        </div>

        {(q.movements ?? []).length > 0 ? (
          <div className="fc-surface overflow-x-auto">
            <table className="fc-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Esperado</th>
                  <th>Recibido</th>
                  <th>Diferencia</th>
                  <th>Estado</th>
                  <th>Evidencia</th>
                </tr>
              </thead>
              <tbody>
                {(q.movements ?? []).map((m, idx) => (
                  <tr key={m.custodyEventId ?? idx}>
                    <td className="tabular-nums">
                      {m.expectedLiters === null
                        ? '—'
                        : formatVolume(m.expectedLiters)}
                    </td>
                    <td className="tabular-nums">
                      {m.receivedLiters === null
                        ? '—'
                        : formatVolume(m.receivedLiters)}
                    </td>
                    <td className="tabular-nums">
                      {m.differenceLiters === null
                        ? '—'
                        : `${m.differenceLiters > 0 ? '+' : ''}${m.differenceLiters.toLocaleString('es-BO')} L`}
                    </td>
                    <td>{labelEs(m.status)}</td>
                    <td>
                      {m.custodyEventId ? (
                        <EvidenceVerify custodyEventId={m.custodyEventId} />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--mute)]">
            Todavía no hay una recepción registrada para reconciliar.
          </p>
        )}

        <p className="text-sm text-[var(--mute)]">
          Instantánea DEMO de etapas del lote. El volumen declarado del lote no
          es el esperado de una cisterna.
        </p>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {q.steps.map((step, i) => (
            <li
              key={step.key}
              className="border border-[var(--rail)]/45 bg-white/50 px-4 py-4"
            >
              <p className="font-display text-xs font-bold tracking-wide text-[var(--mute)]">
                {String(i + 1).padStart(2, '0')} · {step.label}
              </p>
              <p className="font-display mt-2 text-2xl font-black tabular-nums">
                {step.liters === null ? '—' : formatVolume(step.liters)}
              </p>
            </li>
          ))}
        </ol>

        {q.deltas.length > 0 && (
          <ul className="space-y-1 text-sm text-[var(--mute)]">
            {q.deltas.map((d) => (
              <li key={`${d.from}-${d.to}`}>
                {d.from} → {d.to}:{' '}
                <span
                  className={
                    d.differenceLiters === 0
                      ? 'text-[var(--seal)]'
                      : 'font-semibold text-[var(--alarm)]'
                  }
                >
                  {d.differenceLiters > 0 ? '+' : ''}
                  {d.differenceLiters.toLocaleString('es-BO')} L
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display mb-5 text-xl font-bold">Cadena de custodia</h2>
        <ol className="space-y-0 border-l-2 border-[var(--diesel)] pl-5">
          {passport.custody.map((e) => (
            <li key={e.id} className="relative pb-7 last:pb-0">
              <span
                className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 bg-[var(--diesel)]"
                aria-hidden
              />
              <p className="font-medium capitalize">{formatStatus(e.eventType)}</p>
              <p className="mt-1 text-sm text-[var(--mute)]">
                {e.location ?? 'Sin ubicación'} ·{' '}
                {new Date(e.timestamp).toLocaleString('es-BO')}
              </p>
              {(e.measuredVolume || e.declaredVolume) && (
                <p className="mt-1 text-sm tabular-nums text-[var(--mute)]">
                  Declarado {e.declaredVolume ?? '—'} · Medido{' '}
                  {e.measuredVolume ?? '—'}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {passport.anomalies.length > 0 && (
        <section className="border-2 border-[var(--alarm)] bg-[var(--alarm-soft)] p-5">
          <h2 className="font-display text-xl font-bold text-[var(--alarm)]">
            Discrepancias
          </h2>
          <p className="mt-2 text-sm text-[var(--mute)]">
            Señal para revisión humana. Discrepancia ≠ robo.
          </p>
          <ul className="mt-3 space-y-2">
            {passport.anomalies.map((a, idx) => (
              <li key={idx} className="text-sm text-[var(--mute)]">
                <span className="font-medium text-[var(--alarm)]">
                  {riskLabel(a.severity)} · {formatStatus(a.type)}
                </span>
                {a.difference ? ` — ${a.difference}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display mb-3 text-xl font-bold">Documentos</h2>
          {passport.documents.length === 0 ? (
            <p className="text-sm text-[var(--mute)]">Sin documentos.</p>
          ) : (
            <ul className="divide-y divide-[var(--rail)]/35 border border-[var(--rail)]/45 bg-[var(--paper)]">
              {passport.documents.map((d) => (
                <li key={d.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{d.name}</p>
                  <p className="mt-1 capitalize text-[var(--mute)]">
                    {formatStatus(d.type)}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-[var(--mute)]">
                    {d.sha256Hash}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl font-bold">
            Calidad / laboratorio
          </h2>
          {passport.quality.certificates.length === 0 &&
          passport.quality.labAnalyses.length === 0 ? (
            <p className="text-sm text-[var(--mute)]">Sin registros de calidad.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {passport.quality.certificates.map((c) => (
                <li key={c.id} className="border border-[var(--rail)]/45 bg-[var(--paper)] px-4 py-3">
                  Cert. {c.certificateNumber} ·{' '}
                  <span className="capitalize text-[var(--mute)]">
                    {formatStatus(c.status)}
                  </span>
                </li>
              ))}
              {passport.quality.labAnalyses.map((l) => (
                <li key={l.id} className="border border-[var(--rail)]/45 bg-[var(--paper)] px-4 py-3">
                  Lab {l.laboratory} ·{' '}
                  <span className="capitalize text-[var(--mute)]">
                    {formatStatus(l.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {passport.iot.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-xl font-bold">Mediciones</h2>
          <div className="fc-surface overflow-x-auto">
            <table className="fc-table min-w-[480px]">
              <thead>
                <tr>
                  <th>Fuente</th>
                  <th>Volumen</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {passport.iot.slice(0, 5).map((m) => (
                  <tr key={m.id}>
                    <td>{m.source}</td>
                    <td className="tabular-nums">{formatVolume(m.volumeLiters)}</td>
                    <td className="text-[var(--mute)]">
                      {new Date(m.timestamp).toLocaleString('es-BO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display mb-3 text-xl font-bold">Evidencia en cadena</h2>
        <p className="mb-4 max-w-2xl text-sm text-[var(--mute)]">
          Estado del ancla de recepción. No afirma que los litros físicos sean
          reales; solo si el hash quedó registrado.
        </p>
        {passport.blockchain.length === 0 ? (
          <p className="text-sm text-[var(--mute)]">
            Sin anclas. Tras una recepción, el estado puede quedar pendiente si
            la conexión a la cadena no está configurada.
          </p>
        ) : (
          <div className="fc-surface overflow-x-auto">
            <table className="fc-table min-w-[880px]">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Hash</th>
                  <th>Tx</th>
                  <th>Explorador</th>
                  <th>Bloque</th>
                  <th>Contrato</th>
                  <th>Red</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {passport.blockchain.slice(0, 8).map((a) => (
                  <tr key={a.id}>
                    <td
                      className={
                        a.status === 'CONFIRMED'
                          ? 'text-[var(--seal)]'
                          : a.status === 'FAILED'
                            ? 'text-[var(--alarm)]'
                            : 'text-[var(--diesel)]'
                      }
                    >
                      {labelEs(a.status)}
                    </td>
                    <td className="max-w-[140px] truncate font-mono text-xs text-[var(--mute)]">
                      {a.dataHash}
                    </td>
                    <td className="max-w-[160px] truncate font-mono text-xs text-[var(--mute)]">
                      {a.transactionHash ?? '—'}
                    </td>
                    <td>
                      {explorerTxUrl(a.transactionHash, a.explorerUrl) ? (
                        <a
                          href={explorerTxUrl(a.transactionHash, a.explorerUrl)!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--diesel)] hover:underline"
                        >
                          Ver en explorador
                        </a>
                      ) : (
                        <span className="text-[var(--mute)]">—</span>
                      )}
                    </td>
                    <td className="tabular-nums">{a.blockNumber ?? '—'}</td>
                    <td className="max-w-[140px] truncate font-mono text-xs text-[var(--mute)]">
                      {a.contractAddress ?? '—'}
                    </td>
                    <td>{a.network}</td>
                    <td className="text-[var(--mute)]">
                      {new Date(a.timestamp).toLocaleString('es-BO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <LiveAnchorPanel defaultBatchCode={idn.batchCode} />
    </div>
  );
}
