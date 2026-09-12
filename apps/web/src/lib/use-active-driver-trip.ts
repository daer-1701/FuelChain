'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

export type ActiveDriverTrip = {
  cisternCode: string;
  qrToken: string;
  stationCode: string;
  stationName: string;
  batchCode: string;
  status: string;
  deepLinkPath: string;
};

/** Viaje LOADED / IN_TRANSIT de la cisterna del chofer (uno a la vez). */
export function useActiveDriverTrip(cisternCode: string | null | undefined) {
  const [trip, setTrip] = useState<ActiveDriverTrip | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!cisternCode) {
      setTrip(null);
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/c/${encodeURIComponent(cisternCode)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = (await res.json()) as {
          data: {
            cistern: { code: string; qrToken: string; deepLinkPath: string };
            delivery: {
              status: string;
              batch: { batchCode: string };
              station: { code: string; name: string };
            } | null;
          };
        };
        const d = json.data.delivery;
        const open =
          d && (d.status === 'LOADED' || d.status === 'IN_TRANSIT')
            ? {
                cisternCode: json.data.cistern.code,
                qrToken: json.data.cistern.qrToken,
                stationCode: d.station.code,
                stationName: d.station.name,
                batchCode: d.batch.batchCode,
                status: d.status,
                deepLinkPath: json.data.cistern.deepLinkPath,
              }
            : null;
        if (!cancelled) setTrip(open);
      } catch {
        if (!cancelled) setTrip(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cisternCode]);

  return { trip, ready, refreshKey: cisternCode };
}
