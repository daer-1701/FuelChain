import Link from 'next/link';
import { AuditWorkbench } from '@/components/audit-workbench';
import { apiGet } from '@/lib/api';
import { formatStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type AuditDetail = {
  case: {
    id: string;
    title: string;
    status: string;
    riskScore: number;
    aiExplanation: string | null;
    blockchainTxHash: string | null;
    batch: { batchCode: string };
    notes: Array<{ id: string; body: string; createdAt: string }>;
  };
  disclaimer: string;
};

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let detail: AuditDetail | null = null;
  let error: string | null = null;
  try {
    detail = await apiGet<AuditDetail>(`/audits/${id}`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Not found';
  }

  if (!detail) {
    return (
      <p role="alert" className="text-[var(--alarm)]">
        {error}
      </p>
    );
  }

  const c = detail.case;

  return (
    <div className="space-y-8">
      <Link
        href="/audits"
        className="text-sm text-[var(--mute)] underline-offset-4 hover:text-[var(--diesel)] hover:underline"
      >
        Volver a auditorías
      </Link>
      <header className="max-w-3xl border-b-2 border-[var(--ink)] pb-5">
        <h1 className="font-display text-3xl font-black tracking-tight">
          {c.title}
        </h1>
        <p className="mt-3 text-[var(--mute)]">{detail.disclaimer}</p>
      </header>

      <section className="grid gap-5 border border-[var(--rail)]/45 bg-[var(--paper)] p-5 sm:grid-cols-3">
        <div>
          <p className="text-sm text-[var(--mute)]">Lote</p>
          <Link
            href={`/batches/${c.batch.batchCode}`}
            className="fc-batch-code mt-1 inline-block text-[var(--diesel)]"
          >
            {c.batch.batchCode}
          </Link>
        </div>
        <div>
          <p className="text-sm text-[var(--mute)]">Riesgo</p>
          <p className="font-display mt-1 text-2xl font-black tabular-nums text-[var(--alarm)]">
            {c.riskScore}
          </p>
        </div>
        <div>
          <p className="text-sm text-[var(--mute)]">Estado</p>
          <p className="mt-1 capitalize">{formatStatus(c.status)}</p>
        </div>
      </section>

      {c.aiExplanation && (
        <section className="border-y border-[var(--rail)]/45 py-5">
          <h2 className="font-display text-xl font-bold">Explicación asistida</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--mute)]">
            {c.aiExplanation}
          </pre>
        </section>
      )}

      {c.blockchainTxHash && (
        <p className="break-all text-sm text-[var(--mute)]">
          Transacción de evidencia (demo): {c.blockchainTxHash}
        </p>
      )}

      <AuditWorkbench caseId={c.id} currentStatus={c.status} />

      <section>
        <h2 className="font-display text-xl font-bold">Notas del auditor</h2>
        <ul className="mt-4 divide-y divide-[var(--rail)]/35 border-y border-[var(--rail)]/45">
          {c.notes.map((n) => (
            <li key={n.id} className="py-3 text-sm leading-relaxed text-[var(--mute)]">
              {n.body}
            </li>
          ))}
          {c.notes.length === 0 && (
            <li className="py-3 text-sm text-[var(--mute)]">Sin notas aún.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
