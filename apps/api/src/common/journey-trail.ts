import { CheckpointKind, Prisma } from '@prisma/client';

export type JourneySampleInput = {
  clientEventId?: string;
  kind?: CheckpointKind | string;
  label?: string;
  volumeLiters: number;
  density?: number;
  temperature?: number;
  waterDetected?: boolean;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  capturedAt?: string;
  note?: string;
};

export type VolumeDrop = {
  deltaLiters: number;
  previousLiters: number;
  nextLiters: number;
  fromLabel: string;
  toLabel: string;
  fromAt: string;
  toAt: string;
  latitude: number;
  longitude: number;
  hoursBetween: number;
  note: string;
};

export type QualityChange = {
  metric: 'density' | 'temperature' | 'water';
  previousValue: number | boolean | null;
  nextValue: number | boolean | null;
  delta: number | null;
  fromLabel: string;
  toLabel: string;
  fromAt: string;
  toAt: string;
  latitude: number;
  longitude: number;
  hoursBetween: number;
  note: string;
};

type PointLike = {
  kind?: string | null;
  label?: string | null;
  volumeLiters: { toString(): string } | number | string;
  density?: { toString(): string } | number | string | null;
  temperature?: { toString(): string } | number | string | null;
  waterDetected?: boolean | null;
  latitude: number;
  longitude: number;
  capturedAt: Date | string;
};

function orderedPoints(points: PointLike[]) {
  return [...points].sort(
    (a, b) =>
      new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );
}

function segmentMeta(prev: PointLike, next: PointLike) {
  const fromAt = new Date(prev.capturedAt);
  const toAt = new Date(next.capturedAt);
  const hoursBetween = Math.max(
    0,
    (toAt.getTime() - fromAt.getTime()) / 3_600_000,
  );
  return {
    fromLabel: String(prev.label || prev.kind || 'Punto anterior'),
    toLabel: String(next.label || next.kind || 'Punto siguiente'),
    fromAt: fromAt.toISOString(),
    toAt: toAt.toISOString(),
    latitude: next.latitude,
    longitude: next.longitude,
    hoursBetween: Number(hoursBetween.toFixed(2)),
  };
}

export function computeVolumeDrops(points: PointLike[]): VolumeDrop[] {
  if (points.length < 2) return [];
  const ordered = orderedPoints(points);
  const drops: VolumeDrop[] = [];
  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const next = ordered[i];
    const previousLiters = Number(prev.volumeLiters.toString());
    const nextLiters = Number(next.volumeLiters.toString());
    const deltaLiters = Number((nextLiters - previousLiters).toFixed(3));
    if (Math.abs(deltaLiters) < 0.001) continue;
    const meta = segmentMeta(prev, next);
    drops.push({
      deltaLiters,
      previousLiters,
      nextLiters,
      ...meta,
      note:
        deltaLiters < 0
          ? `Bajó ${Math.abs(deltaLiters)} L entre «${meta.fromLabel}» y «${meta.toLabel}»`
          : `Subió ${deltaLiters} L entre «${meta.fromLabel}» y «${meta.toLabel}»`,
    });
  }
  return drops;
}

/** Cambios de calidad proxy (densidad / temperatura / agua) con hora y GPS. */
export function computeQualityChanges(points: PointLike[]): QualityChange[] {
  if (points.length < 2) return [];
  const ordered = orderedPoints(points);
  const out: QualityChange[] = [];

  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const next = ordered[i];
    const meta = segmentMeta(prev, next);

    const prevDens =
      prev.density != null && prev.density !== ''
        ? Number(prev.density.toString())
        : null;
    const nextDens =
      next.density != null && next.density !== ''
        ? Number(next.density.toString())
        : null;
    if (
      prevDens != null &&
      nextDens != null &&
      Number.isFinite(prevDens) &&
      Number.isFinite(nextDens)
    ) {
      const delta = Number((nextDens - prevDens).toFixed(4));
      if (Math.abs(delta) >= 0.0005) {
        out.push({
          metric: 'density',
          previousValue: prevDens,
          nextValue: nextDens,
          delta,
          ...meta,
          note:
            delta < 0
              ? `Densidad bajó ${Math.abs(delta)} (${prevDens} → ${nextDens}) entre «${meta.fromLabel}» y «${meta.toLabel}»`
              : `Densidad subió ${delta} (${prevDens} → ${nextDens}) entre «${meta.fromLabel}» y «${meta.toLabel}»`,
        });
      }
    }

    const prevTemp =
      prev.temperature != null && prev.temperature !== ''
        ? Number(prev.temperature.toString())
        : null;
    const nextTemp =
      next.temperature != null && next.temperature !== ''
        ? Number(next.temperature.toString())
        : null;
    if (
      prevTemp != null &&
      nextTemp != null &&
      Number.isFinite(prevTemp) &&
      Number.isFinite(nextTemp)
    ) {
      const delta = Number((nextTemp - prevTemp).toFixed(2));
      if (Math.abs(delta) >= 0.1) {
        out.push({
          metric: 'temperature',
          previousValue: prevTemp,
          nextValue: nextTemp,
          delta,
          ...meta,
          note:
            delta < 0
              ? `Temperatura bajó ${Math.abs(delta)} °C (${prevTemp} → ${nextTemp}) entre «${meta.fromLabel}» y «${meta.toLabel}»`
              : `Temperatura subió ${delta} °C (${prevTemp} → ${nextTemp}) entre «${meta.fromLabel}» y «${meta.toLabel}»`,
        });
      }
    }

    const prevWater = Boolean(prev.waterDetected);
    const nextWater = Boolean(next.waterDetected);
    if (prevWater !== nextWater) {
      out.push({
        metric: 'water',
        previousValue: prevWater,
        nextValue: nextWater,
        delta: null,
        ...meta,
        note: nextWater
          ? `Agua detectada entre «${meta.fromLabel}» y «${meta.toLabel}»`
          : `Agua ya no detectada entre «${meta.fromLabel}» y «${meta.toLabel}»`,
      });
    }
  }

  return out;
}

export function parseJourneyTrail(raw: unknown): JourneySampleInput[] {
  if (!Array.isArray(raw)) return [];
  const out: JourneySampleInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const volumeLiters = Number(row.volumeLiters ?? row.vol);
    const latitude = Number(row.latitude ?? row.lat);
    const longitude = Number(row.longitude ?? row.lng);
    if (
      !Number.isFinite(volumeLiters) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      continue;
    }
    out.push({
      clientEventId:
        typeof row.clientEventId === 'string' ? row.clientEventId : undefined,
      kind: typeof row.kind === 'string' ? row.kind : 'ROUTE_WAYPOINT',
      label: typeof row.label === 'string' ? row.label : undefined,
      volumeLiters,
      density:
        row.density != null && Number.isFinite(Number(row.density))
          ? Number(row.density)
          : undefined,
      temperature:
        row.temperature != null && Number.isFinite(Number(row.temperature))
          ? Number(row.temperature)
          : undefined,
      waterDetected: Boolean(row.waterDetected ?? row.water),
      latitude,
      longitude,
      accuracyMeters:
        row.accuracyMeters != null && Number.isFinite(Number(row.accuracyMeters))
          ? Number(row.accuracyMeters)
          : undefined,
      capturedAt:
        typeof row.capturedAt === 'string'
          ? row.capturedAt
          : typeof row.ts === 'number'
            ? new Date(row.ts * 1000).toISOString()
            : undefined,
      note: typeof row.note === 'string' ? row.note : undefined,
    });
  }
  return out;
}

export function normalizeCheckpointKind(
  kind?: string,
): CheckpointKind {
  if (kind === 'LOAD_DEPARTURE' || kind === 'ARRIVAL_STATION') {
    return kind;
  }
  return 'ROUTE_WAYPOINT';
}

/** Compact trail for QR payload (offline handoff). */
export function compactTrailForQr(
  samples: Array<{
    clientEventId?: string | null;
    kind: string;
    label?: string | null;
    volumeLiters: { toString(): string } | number;
    density?: { toString(): string } | number | null;
    temperature?: { toString(): string } | number | null;
    waterDetected?: boolean;
    latitude: number;
    longitude: number;
    capturedAt: Date | string;
  }>,
) {
  return samples.map((s, i) => ({
    i,
    kind: s.kind,
    label: s.label ?? undefined,
    vol: Number(Number(s.volumeLiters.toString()).toFixed(3)),
    dens:
      s.density != null ? Number(Number(s.density.toString()).toFixed(4)) : undefined,
    temp:
      s.temperature != null
        ? Number(Number(s.temperature.toString()).toFixed(2))
        : undefined,
    water: Boolean(s.waterDetected),
    lat: Number(s.latitude.toFixed(5)),
    lng: Number(s.longitude.toFixed(5)),
    ts: Math.floor(new Date(s.capturedAt).getTime() / 1000),
    id: s.clientEventId ?? undefined,
  }));
}

export function decimalOrUndef(n?: number) {
  return n != null && Number.isFinite(n) ? new Prisma.Decimal(n) : undefined;
}
