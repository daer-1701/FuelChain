import { BatchesTable } from '@/components/batches-table';
import { CreateBatchForm } from '@/components/create-batch-form';
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
    error = e instanceof Error ? e.message : 'API error';
  }

  return (
    <div className="space-y-8">
      <header className="max-w-xl">
        <h1 className="font-display text-3xl font-black tracking-tight">Lotes</h1>
        <p className="mt-3 leading-relaxed text-[var(--mute)]">
          El lote es la unidad central. Importador declara; chofer despacha;
          estación recibe; ANH y auditor revisan el pasaporte.
        </p>
      </header>

      <CreateBatchForm />

      <form className="fc-surface flex flex-wrap items-end gap-3 p-4">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-sm text-[var(--mute)]">
          Código de lote
          <input
            name="q"
            defaultValue={q}
            placeholder="FC-BO-2026-…"
            className="fc-input"
          />
        </label>
        <label className="flex min-w-[150px] flex-col gap-1.5 text-sm text-[var(--mute)]">
          Estado
          <select name="status" defaultValue={status} className="fc-input">
            <option value="">Todos</option>
            <option value="IN_TRANSIT">En tránsito</option>
            <option value="COMPLETED">Completado</option>
            <option value="AUDIT_REQUIRED">Auditoría requerida</option>
            <option value="CERTIFIED">Certificado</option>
            <option value="STORED">Almacenado</option>
          </select>
        </label>
        <label className="flex min-w-[130px] flex-col gap-1.5 text-sm text-[var(--mute)]">
          Riesgo
          <select name="risk" defaultValue={risk} className="fc-input">
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
