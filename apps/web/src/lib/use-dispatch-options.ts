'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

export type BatchOption = { code: string; label: string };
export type StationOption = { code: string; label: string };

type AuthHeaders = () => HeadersInit;

/** Lotes y estaciones desde la API (fallback DEMO si falla la red). */
export function useDispatchOptions(authHeaders?: AuthHeaders) {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [batchRes, stationRes] = await Promise.all([
          fetch(`${API_URL}/batches?pageSize=40`, {
            headers: authHeaders?.() ?? {},
            cache: 'no-store',
          }),
          fetch(`${API_URL}/stations/public?city=all`, { cache: 'no-store' }),
        ]);

        if (batchRes.ok) {
          const json = (await batchRes.json()) as {
            data: Array<{
              batchCode: string;
              product: string;
              status: string;
            }>;
          };
          const opts = json.data.map((b) => ({
            code: b.batchCode,
            label: `${b.batchCode} · ${b.product} (${b.status})`,
          }));
          if (!cancelled && opts.length) setBatches(opts);
        }

        if (stationRes.ok) {
          const json = (await stationRes.json()) as {
            data: Array<{ code: string; name: string; city?: string }>;
          };
          const opts = json.data.map((s) => ({
            code: s.code,
            label: `${s.code} ${s.name}${s.city ? ` · ${s.city}` : ''}`,
          }));
          if (!cancelled && opts.length) setStations(opts);
        }
      } catch {
        /* fallback abajo */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHeaders]);

  const batchOptions =
    batches.length > 0
      ? batches
      : [
          {
            code: 'FC-BO-2026-000182',
            label: 'FC-BO-2026-000182 · Diésel (fallback)',
          },
          {
            code: 'FC-BO-2026-000184',
            label: 'FC-BO-2026-000184 · Gasolina (fallback)',
          },
        ];

  const stationOptions =
    stations.length > 0
      ? stations
      : [
          { code: 'ST-CBB-01', label: 'ST-CBB-01 Cala Cala (fallback)' },
          { code: 'ST-CBB-02', label: 'ST-CBB-02 Quillacollo (fallback)' },
        ];

  return { batches: batchOptions, stations: stationOptions, ready };
}
