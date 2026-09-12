/** Etiquetas visibles en español (Bolivia). Los valores API siguen en inglés. */

const LABELS: Record<string, string> = {
  // Roles
  ADMIN: 'Administrador',
  IMPORTER: 'Importador',
  TRANSPORTER: 'Chofer',
  DEPOT_OPERATOR: 'Depósito',
  LAB: 'Laboratorio',
  AUDITOR: 'Auditor',
  STATION_STAFF: 'Estación',
  VERIFIER: 'ANH',
  CITIZEN: 'Ciudadano',

  // Lote / entrega / contrato / bastón
  DRAFT: 'Borrador',
  CERTIFIED: 'Certificado',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  COMPLETED: 'Completado',
  AUDIT_REQUIRED: 'Requiere auditoría',
  LOADED: 'Cargado',
  ACTIVE: 'Activo',
  CONSUMED: 'Consumido',
  EXPIRED: 'Vencido',
  CANCELLED: 'Cancelado',
  AVAILABLE: 'Disponible',
  IN_USE: 'En uso',
  OUT_OF_SERVICE: 'Fuera de servicio',
  MAINTENANCE: 'Mantenimiento',

  // Calidad
  PENDING: 'Pendiente',
  PASSED: 'Aprobada',
  FAILED: 'Falló',
  REJECTED: 'Rechazada',
  CERTIFICATE_PENDING: 'Certificado pendiente',
  OK: 'Bien',
  ALERTA: 'Alerta',
  RECHAZADO: 'Rechazado',
  SIN_DATO: 'Sin dato',

  // Liquidación
  PAID: 'Pagada',

  // Riesgo / severidad
  HIGH: 'Alto',
  MEDIUM: 'Medio',
  LOW: 'Bajo',
  CRITICAL: 'Crítico',
  INFO: 'Info',

  // Anomalías / auditoría
  OPEN: 'Abierta',
  UNDER_REVIEW: 'En revisión',
  RESOLVED: 'Resuelta',
  FALSE_POSITIVE: 'Falso positivo',
  CLOSED: 'Cerrada',
  VOLUME_DISCREPANCY: 'Diferencia de volumen',
  QUALITY_DEVIATION: 'Desvío de calidad',
  DOCUMENT_MISMATCH: 'Documentos no coinciden',
  ROUTE_DEVIATION: 'Desvío de ruta',
  SENSOR_GAP: 'Hueco de medición',
  CUSTODY_BREAK: 'Quiebre de custodia',

  // Custodia / eventos
  CREATED: 'Creado',
  AUTHORIZED: 'Autorizado',
  CUSTOMS_CLEARED: 'Aduana liberada',
  RECEIVED: 'Recibido',
  STORED: 'Almacenado',
  SAMPLED: 'Muestreado',
  LAB_ANALYZED: 'Analizado en lab',
  TRANSFERRED: 'Transferido',
  DISCREPANCY_FLAGGED: 'Discrepancia marcada',

  // Checkpoints
  LOAD_DEPARTURE: 'Salida / carga',
  ROUTE_WAYPOINT: 'Control en ruta',
  ARRIVAL_STATION: 'Llegada a estación',

  // Anclas blockchain
  CONFIRMED: 'Confirmado',
  MATCH: 'Coincide',
  MISMATCH: 'No coincide',
  AnomalyRegistered: 'Discrepancia registrada',
  CustodyEventRegistered: 'Custodia registrada',
  MeasurementAnchored: 'Medición anclada',
  DocumentHashAnchored: 'Hash de documento',
  DocumentHashRegistered: 'Hash de documento',
  BatchCreated: 'Lote creado',

  // Disponibilidad pública
  FULL: 'Lleno',
  EMPTY: 'Vacío',
  UNKNOWN: 'Sin dato',
};

export function labelEs(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  const key = value.trim();
  if (LABELS[key]) return LABELS[key];
  const upper = key.toUpperCase();
  if (LABELS[upper]) return LABELS[upper];
  // Fallback legible: SNAKE_CASE → frase
  return key
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function roleLabel(role: string | null | undefined): string {
  return labelEs(role);
}

export function riskLabel(level: string | null | undefined): string {
  return labelEs(level);
}

export function checkpointKindLabel(kind: string | null | undefined): string {
  return labelEs(kind);
}
