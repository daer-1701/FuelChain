import { BatchesTable } from '@/components/batches-table';
import { CreateBatchForm } from '@/components/create-batch-form';
import { MetricRail, OpsPageHeader, riskToneFrom } from '@/components/ops';
import { apiGet } from '@/lib/api';
import type { BatchesList } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const status = typeof sp.status === 'string' ? sp.status : '';
  const risk = typeof sp.risk === 'string' ? sp.risk : '';

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (status) params.set('status', status);
  if (risk) params.set('risk', risk);

  let list: BatchesList | null = null;
  let error: string | null = null;
  try {
    const qs = params.toString();
    list = await apiGet<BatchesList>(`/batches${qs ? `?${qs}` : ''}`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error de API';
  }

  const rows = list?.data ?? [];
  const inTransit = rows.filter((b) => b.status === 'IN_TRANSIT').length;
  const auditReq = rows.filter((b) => b.status === 'AUDIT_REQUIRED').length;
  const highRisk = rows.filter(
    (b) => b.riskLevel === 'HIGH' || b.riskLevel === 'ALTO',
  ).length;

  return (
    <div className="fc-page">
      <OpsPageHeader
        stamp="Lotes · pasaporte del combustible"
        title="Lotes"
        lede="El lote es la unidad central. Importador declara; chofer despacha; estación recibe; ANH y auditor revisan el pasaporte."
      />

      {list ? (
        <MetricRail
          items={[
            {
              label: 'Resultados',
              value: String(list.meta.total),
              hint: `Pág. ${list.meta.page}/${list.meta.pageCount}`,
            },
            {
              label: 'En tránsito',
              value: String(inTransit),
              tone: inTransit > 0 ? 'warn' : 'mute',
            },
            {
              label: 'Auditoría requerida',
              value: String(auditReq),
              tone: auditReq > 0 ? 'danger' : 'ok',
            },
            {
              label: 'Riesgo alto',
              value: String(highRisk),
              tone: riskToneFrom(highRisk > 0 ? 'HIGH' : 'LOW'),
            },
          ]}
        />
      ) : null}

      <CreateBatchForm />

      <form className="flex flex-wrap items-end gap-3 border-2 border-[var(--ink)] p-4">
        <label className="fc-label min-w-[200px] flex-1">
          Código de lote
          <input
            name="q"
            defaultValue={q}
            placeholder="FC-BO-2026-…"
            className="fc-field"
          />
        </label>
        <label className="fc-label min-w-[150px]">
          Estado
          <select name="status" defaultValue={status} className="fc-field">
            <option value="">Todos</option>
            <option value="IN_TRANSIT">En tránsito</option>
            <option value="COMPLETED">Completado</option>
            <option value="AUDIT_REQUIRED">Auditoría requerida</option>
            <option value="CERTIFIED">Certificado</option>
            <option value="STORED">Almacenado</option>
          </select>
        </label>
        <label className="fc-label min-w-[130px]">
          Riesgo
          <select name="risk" defaultValue={risk} className="fc-field">
            <option value="">Todos</option>
            <option value="LOW">Bajo</option>
            <option value="MEDIUM">Medio</option>
            <option value="HIGH">Alto</option>
          </select>
        </label>
        <button type="submit" className="fc-btn">
          Aplicar filtros
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="border border-[var(--alarm)] bg-[var(--alarm-soft)] px-4 py-3 text-sm"
        >
          No se pudieron cargar los lotes: {error}
        </div>
      )}

      {list && list.data.length === 0 && (
        <p className="text-[var(--mute)]">
          No hay lotes con estos filtros. Prueba limpiar la búsqueda.
        </p>
      )}

      {list && list.data.length > 0 && <BatchesTable list={list} />}
    </div>
  );
}
