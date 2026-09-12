import Link from 'next/link';
import { AuditWorkbench } from '@/components/audit-workbench';
import {
  ContextPanel,
  DataPair,
  OpsPageHeader,
  StatusPill,
} from '@/components/ops';
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

function auditStatusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'OPEN' || s === 'IN_REVIEW') return 'warn' as const;
  if (s === 'CLOSED' || s === 'RESOLVED') return 'ok' as const;
  return 'mute' as const;
}

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
    error = e instanceof Error ? e.message : 'No encontrado';
  }

  if (!detail) {
    return (
      <p role="alert" className="text-[var(--alarm)]">
        {error}
      </p>
    );
  }

  const c = detail.case;
  const riskTone =
    c.riskScore >= 70 ? 'danger' : c.riskScore >= 40 ? 'warn' : 'ok';

  return (
    <div className="fc-page">
      <Link
        href="/audits"
        className="text-sm text-[var(--mute)] underline-offset-4 hover:text-[var(--diesel)] hover:underline"
      >
        Volver a auditorías
      </Link>

      <OpsPageHeader
        stamp="Auditor · expediente"
        title={c.title}
        lede={detail.disclaimer}
        actions={
          <StatusPill
            label={formatStatus(c.status)}
            tone={auditStatusTone(c.status)}
          />
        }
      />

      <ContextPanel
        code={c.id.slice(0, 8)}
        title="Resumen del caso"
        subtitle={`Lote ${c.batch.batchCode}`}
        actions={
          <Link
            href={`/batches/${c.batch.batchCode}`}
            className="fc-btn fc-btn-ghost !text-xs"
          >
            Ver lote
          </Link>
        }
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <DataPair label="Lote">
            <Link
              href={`/batches/${c.batch.batchCode}`}
              className="fc-batch-code text-[var(--diesel)]"
            >
              {c.batch.batchCode}
            </Link>
          </DataPair>
          <DataPair label="Riesgo">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-2xl font-black tabular-nums">
                {c.riskScore}
              </p>
              <StatusPill
                label={riskTone === 'danger' ? 'Alto' : riskTone === 'warn' ? 'Medio' : 'Bajo'}
                tone={riskTone}
                pulse={riskTone === 'danger'}
              />
            </div>
          </DataPair>
          <DataPair label="Estado">
            <StatusPill
              label={formatStatus(c.status)}
              tone={auditStatusTone(c.status)}
            />
          </DataPair>
        </div>

        {c.aiExplanation && (
          <section className="border-t border-[var(--rail)]/40 pt-4">
            <h2 className="fc-section-title">Explicación asistida</h2>
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
      </ContextPanel>

      <AuditWorkbench caseId={c.id} currentStatus={c.status} />

      <section>
        <h2 className="fc-section-title">Notas del auditor</h2>
        <ul className="mt-4 divide-y divide-[var(--rail)]/35 border-y-2 border-[var(--ink)]">
          {c.notes.map((n) => (
            <li
              key={n.id}
              className="py-3 text-sm leading-relaxed text-[var(--mute)] fc-ops-rise"
            >
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
