/** Historial local de QR escaneados en la estación (DEMO). */

export type StationScanEntry = {
  token: string;
  path: string;
  cisternCode?: string | null;
  deviceId?: string | null;
  batchCode?: string | null;
  product?: string | null;
  status?: string | null;
  scannedAt: string;
};

const KEY = 'fc-station-scan-history';
const MAX = 40;

export function loadStationScanHistory(): StationScanEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StationScanEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberStationScan(
  entry: Omit<StationScanEntry, 'scannedAt'> & { scannedAt?: string },
): StationScanEntry[] {
  const next: StationScanEntry = {
    ...entry,
    scannedAt: entry.scannedAt ?? new Date().toISOString(),
  };
  const prev = loadStationScanHistory().filter((e) => e.token !== next.token);
  const list = [next, ...prev].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
  return list;
}

export function clearStationScanHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
