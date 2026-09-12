'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useAuth } from '@/components/auth-provider';
import { API_URL } from '@/lib/api';
import { errorFromResponse, friendlyError } from '@/lib/api-error';
import { canCreateBatch } from '@/lib/role-access';

export function CreateBatchForm() {
  const { user, authHeaders } = useAuth();
  const router = useRouter();
  const canCreate = canCreateBatch(user?.role);
  const [product, setProduct] = useState('Diésel');
  const [volume, setVolume] = useState('25000');
  const [origin, setOrigin] = useState('Argentina');
  const [destination, setDestination] = useState('Cochabamba, Bolivia');
  const [supplier, setSupplier] = useState('YPF SA');
  const [importer, setImporter] = useState('Importadora DEMO BO');
  const [log, setLog] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!canCreate) return null;

  function submit() {
    start(async () => {
      setLog(null);
      try {
        const res = await fetch(`${API_URL}/batches`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            product,
            declaredVolumeLiters: Number(volume),
            originCountry: origin,
            destination,
            supplier,
            importer,
            isDemo: true,
          }),
        });
        if (!res.ok) throw await errorFromResponse(res, 'No se pudo crear el lote.');
        const json = (await res.json()) as { batchCode?: string };
        const code = json.batchCode;
        setLog(code ? `Lote creado: ${code}` : 'Lote creado.');
        router.refresh();
        if (code) router.push(`/batches/${code}`);
      } catch (e) {
        setLog(friendlyError(e, 'No se pudo crear el lote'));
      }
    });
  }

  return (
    <section className="fc-sheet space-y-4">
      <h2 className="font-display text-xl font-bold">Registrar lote</h2>
      <p className="text-sm text-[var(--mute)]">
        Trabajo del importador: declarar el volumen que entra a la cadena DEMO.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Producto
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Volumen declarado (L)
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2 tabular-nums"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Origen
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Destino
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Proveedor
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Importador
          <input
            className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
            value={importer}
            onChange={(e) => setImporter(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="bg-[var(--diesel)] px-4 py-2 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
      >
        {pending ? 'Creando…' : 'Crear lote DEMO'}
      </button>
      {log && <p className="text-sm">{log}</p>}
    </section>
  );
}
