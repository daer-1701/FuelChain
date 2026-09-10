import Link from 'next/link';
import { LiveAnchorPanel } from '@/components/live-anchor-panel';
import { apiGet } from '@/lib/api';
import { formatStatus, formatVolume, riskClass } from '@/lib/types';

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
  quantity: { declared: string | number; note: string };
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
    error = e instanceof Error ? e.message : 'Not found';
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
            <p className="text-sm text-[var(--mute)]">Pasaporte del lote</p>
            <h1 className="fc-batch-code mt-2 text-3xl text-[var(--diesel)] md:text-5xl">
              {idn.batchCode}
            </h1>
            <p className="mt-3 text-lg">
              {idn.product}
              <span className="text-[var(--mute)]">
                {' '}
                · {formatVolume(idn.declaredVolumeLiters)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className={`fc-stamp ${riskClass(idn.riskLevel)}`}>
              Riesgo {idn.riskLevel.toLowerCase()}
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

      <section className="border-y-2 border-[var(--ink)] py-5">
        <h2 className="font-display text-xl font-bold">Cantidad</h2>
        <p className="font-display mt-2 text-3xl font-black tabular-nums">
          {formatVolume(passport.quantity.declared)}
        </p>
        <p className="mt-2 max-w-xl text-sm text-[var(--mute)]">
          {passport.quantity.note}
        </p>
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
          <ul className="mt-3 space-y-2">
            {passport.anomalies.map((a, idx) => (
              <li key={idx} className="text-sm text-[var(--mute)]">
                <span className="font-medium text-[var(--alarm)]">
                  {a.severity.toLowerCase()} · {formatStatus(a.type)}
                </span>
                {a.difference ? ` — ${a.difference}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <LiveAnchorPanel defaultBatchCode={idn.batchCode} />
    </div>
  );
}
