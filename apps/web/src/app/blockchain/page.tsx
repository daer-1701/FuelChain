'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { LiveAnchorPanel } from '@/components/live-anchor-panel';
import { API_URL } from '@/lib/api';
import { friendlyError } from '@/lib/api-error';
import { labelEs } from '@/lib/es-labels';
import { homeForRole } from '@/lib/role-access';

type AnchorRow = {
  id: string;
  eventKind: string;
  dataHash: string;
  transactionHash: string | null;
  blockNumber: string | null;
  timestamp: string;
  status: string;
  explorerUrl: string | null;
  batch: { batchCode: string };
};

export default function BlockchainPage() {
  const { user, ready, authHeaders } = useAuth();
  const [rows, setRows] = useState<AnchorRow[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isStation = user?.role === 'STATION_STAFF';

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const qs =
          isStation && user?.stationCode
            ? `?stationCode=${encodeURIComponent(user.stationCode)}`
            : '';
        const res = await fetch(`${API_URL}/blockchain/anchors${qs}`, {
          headers: authHeaders(),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { note?: string; data: AnchorRow[] };
        if (!cancelled) {
          setRows(json.data ?? []);
          setNote(json.note ?? '');
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(friendlyError(e, 'No se pudo cargar la evidencia'));
          setRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user?.id, user?.stationCode, isStation, authHeaders]);

  if (!ready) {
    return <p className="text-[var(--mute)]">Cargando…</p>;
  }

  return (
    <div className="fc-page">
      <header className="fc-page-header">
        <p className="fc-stamp text-[var(--mute)]">
          {isStation
            ? `Estación · evidencia HSK${user?.stationCode ? ` · ${user.stationCode}` : ''}`
            : 'ANH · integridad del registro (HSK)'}
        </p>
        <h1 className="fc-title">Evidencia en cadena</h1>
        <p className="fc-lede">
          {isStation ? (
            <>
              Solo ves anclas de <strong>recepciones en tu EESS</strong>
              {user?.stationCode ? ` (${user.stationCode})` : ''}. Cada fila es
              el sello HSK de cuando aceptaste un QR — no el inventario de otras
              estaciones.
            </>
          ) : (
            <>
              Acá no ves litros ni el mapa del viaje. Ves si el{' '}
              <strong>evento de recepción</strong> (cuando la estación aceptó el
              QR) quedó anclado en blockchain (HSK): un hash + transacción que
              cualquiera puede abrir en el explorador.
            </>
          )}
        </p>
        {!isStation && (
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-[var(--mute)]">
            <li>
              <strong className="text-[var(--ink)]">Movimientos / Tramos</strong>{' '}
              = operación (quién llevó qué, cantidad y calidad en el camino).
            </li>
            <li>
              <strong className="text-[var(--ink)]">Evidencia</strong> = sello
              digital de que ese registro existió y no se reescribió a
              escondidas.
            </li>
            <li>
              No prueba el litro físico ni reemplaza la auditoría humana. Si la
              chain está caída, la entrega igual se completa y el ancla queda
              pendiente.
            </li>
          </ul>
        )}
        {note ? <p className="fc-meta mt-3">{note}</p> : null}
        {isStation && (
          <Link
            href={homeForRole(user?.role)}
            className="mt-3 inline-block text-sm font-semibold text-[var(--diesel)] underline"
          >
            Volver a mi estación
          </Link>
        )}
      </header>

      {!isStation && <LiveAnchorPanel />}

      {error && (
        <p role="alert" className="text-[var(--alarm)]">
          {error}
        </p>
      )}

      <section className="fc-surface overflow-x-auto">
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-[var(--mute)]">
                  {isStation
                    ? 'Todavía no hay evidencia anclada de recepciones en tu estación. Confirmá un QR y vuelve aquí.'
                    : 'Sin anclas registradas.'}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link
                      href={`/batches/${r.batch.batchCode}`}
                      className="fc-batch-code text-[var(--diesel)]"
                    >
                      {r.batch.batchCode}
                    </Link>
                  </td>
                  <td>{labelEs(r.eventKind)}</td>
                  <td className="max-w-[160px] truncate text-[var(--mute)]">
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
                  <td>{labelEs(r.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
