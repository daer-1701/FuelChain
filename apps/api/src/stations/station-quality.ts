/** Derive DEMO quality signal from tank measurement + linked batch. */

export type QualityTone = 'OK' | 'ALERTA' | 'RECHAZADO' | 'SIN_DATO';

export type QualityAssessment = {
  tone: QualityTone;
  label: string;
  summary: string;
  waterDetected: boolean;
  density: number | null;
  temperature: number | null;
  batchCode: string | null;
  batchQualityStatus: string | null;
  certificateStatus: string | null;
};

type Input = {
  waterDetected?: boolean | null;
  density?: number | null;
  temperature?: number | null;
  batchCode?: string | null;
  batchQualityStatus?: string | null;
  certificateStatus?: string | null;
  labResult?: string | null;
};

const DENSITY_MIN = 0.72;
const DENSITY_MAX = 0.78;

export function assessStationQuality(input: Input): QualityAssessment {
  const waterDetected = Boolean(input.waterDetected);
  const density =
    input.density != null && !Number.isNaN(input.density)
      ? input.density
      : null;
  const temperature =
    input.temperature != null && !Number.isNaN(input.temperature)
      ? input.temperature
      : null;
  const batchQualityStatus = input.batchQualityStatus ?? null;
  const certificateStatus = input.certificateStatus ?? null;
  const labResult = input.labResult ?? null;

  if (batchQualityStatus === 'REJECTED' || labResult === 'FAIL') {
    return {
      tone: 'RECHAZADO',
      label: 'Rechazado',
      summary: 'Lote o análisis con resultado negativo (DEMO).',
      waterDetected,
      density,
      temperature,
      batchCode: input.batchCode ?? null,
      batchQualityStatus,
      certificateStatus,
    };
  }

  if (waterDetected) {
    return {
      tone: 'ALERTA',
      label: 'Alerta calidad',
      summary: 'Proxy IoT: agua detectada en tanque (DEMO).',
      waterDetected,
      density,
      temperature,
      batchCode: input.batchCode ?? null,
      batchQualityStatus,
      certificateStatus,
    };
  }

  if (density != null && (density < DENSITY_MIN || density > DENSITY_MAX)) {
    return {
      tone: 'ALERTA',
      label: 'Alerta calidad',
      summary: `Densidad fuera de rango DEMO (${density.toFixed(3)}).`,
      waterDetected,
      density,
      temperature,
      batchCode: input.batchCode ?? null,
      batchQualityStatus,
      certificateStatus,
    };
  }

  if (
    batchQualityStatus === 'CERTIFIED' ||
    batchQualityStatus === 'DEMO' ||
    certificateStatus === 'VALID' ||
    certificateStatus === 'DEMO' ||
    labResult === 'PASS' ||
    labResult === 'PASS (DEMO)'
  ) {
    return {
      tone: 'OK',
      label: 'Calidad OK',
      summary: 'Certificado / lab del último lote recibido (DEMO).',
      waterDetected,
      density,
      temperature,
      batchCode: input.batchCode ?? null,
      batchQualityStatus,
      certificateStatus,
    };
  }

  if (density != null || temperature != null) {
    return {
      tone: 'OK',
      label: 'Calidad OK',
      summary: 'Medición reciente sin alertas (DEMO).',
      waterDetected,
      density,
      temperature,
      batchCode: input.batchCode ?? null,
      batchQualityStatus,
      certificateStatus,
    };
  }

  return {
    tone: 'SIN_DATO',
    label: 'Sin dato',
    summary: 'Sin medición ni certificado reciente.',
    waterDetected,
    density,
    temperature,
    batchCode: input.batchCode ?? null,
    batchQualityStatus,
    certificateStatus,
  };
}

export function publicLevelFromAvailability(
  availability: string,
): string {
  switch (availability) {
    case 'FULL':
      return 'Lleno';
    case 'MEDIUM':
      return 'Medio';
    case 'LOW':
      return 'Bajo';
    case 'EMPTY':
      return 'Sin stock';
    default:
      return 'Sin dato';
  }
}
