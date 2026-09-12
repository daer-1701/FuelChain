/** UI navigation and homes aligned to FuelChain roles (job = screen). */

export type AppRole =
  | 'ADMIN'
  | 'IMPORTER'
  | 'TRANSPORTER'
  | 'DEPOT_OPERATOR'
  | 'LAB'
  | 'AUDITOR'
  | 'STATION_STAFF'
  | 'VERIFIER'
  | 'CITIZEN';

export type NavItem = {
  href: string;
  label: string;
};

const ALL_NAV: NavItem[] = [
  { href: '/', label: 'Resumen' },
  { href: '/supervision', label: 'Supervisión' },
  { href: '/estacion', label: 'Mi estación' },
  { href: '/batches', label: 'Lotes' },
  { href: '/mapa', label: 'Cochabamba' },
  { href: '/simular', label: 'Simular' },
  { href: '/verify', label: 'QR custodia' },
  { href: '/anomalies', label: 'Discrepancias' },
  { href: '/audits', label: 'Auditorías' },
  { href: '/blockchain', label: 'Evidencia' },
];

/**
 * Menú por rol — solo pantallas que el actor usa de verdad.
 * - Chofer: emite QR / simula despacho
 * - Estación: inventario propio + recibir QR (/q, no menú)
 * - ANH: supervisión de la red
 * - Auditor: casos y discrepancias
 * - Importador: lotes y evidencia
 * - Depósito: carga a cisterna (QR / simular)
 * - Lab: lotes / calidad (pasaporte)
 * - Ciudadano: solo mapa
 */
const NAV_BY_ROLE: Record<AppRole, string[]> = {
  ADMIN: ALL_NAV.map((n) => n.href),
  IMPORTER: ['/', '/batches', '/mapa', '/blockchain'],
  TRANSPORTER: ['/verify', '/simular', '/batches', '/mapa'],
  DEPOT_OPERATOR: ['/verify', '/simular', '/batches', '/anomalies'],
  STATION_STAFF: ['/estacion', '/mapa', '/anomalies', '/batches'],
  LAB: ['/batches', '/anomalies'],
  AUDITOR: [
    '/audits',
    '/anomalies',
    '/supervision',
    '/batches',
    '/blockchain',
  ],
  VERIFIER: ['/supervision', '/batches', '/mapa', '/blockchain'],
  CITIZEN: ['/mapa'],
};

export const HOME_BY_ROLE: Record<AppRole, string> = {
  ADMIN: '/supervision',
  IMPORTER: '/batches',
  TRANSPORTER: '/verify',
  DEPOT_OPERATOR: '/verify',
  STATION_STAFF: '/estacion',
  LAB: '/batches',
  AUDITOR: '/audits',
  VERIFIER: '/supervision',
  CITIZEN: '/mapa',
};

/** Rutas permitidas (menú + deep links como /q). */
const ROUTES_BY_ROLE: Record<AppRole, string[]> = {
  ADMIN: ['/'],
  IMPORTER: ['/', '/batches', '/mapa', '/blockchain'],
  TRANSPORTER: ['/verify', '/simular', '/batches', '/mapa', '/q'],
  DEPOT_OPERATOR: [
    '/verify',
    '/simular',
    '/batches',
    '/anomalies',
    '/q',
  ],
  STATION_STAFF: [
    '/estacion',
    '/mapa',
    '/anomalies',
    '/batches',
    '/q',
  ],
  LAB: ['/batches', '/anomalies'],
  AUDITOR: [
    '/audits',
    '/anomalies',
    '/supervision',
    '/batches',
    '/blockchain',
    '/mapa',
  ],
  VERIFIER: ['/supervision', '/batches', '/mapa', '/blockchain'],
  CITIZEN: ['/mapa'],
};

export const ROLE_BLURB: Record<AppRole, string> = {
  ADMIN: 'Acceso completo DEMO.',
  IMPORTER: 'Crea y sigue lotes de importación.',
  TRANSPORTER: 'Emite QR de despacho desde tu cisterna.',
  DEPOT_OPERATOR: 'Carga cisternas y registra despachos.',
  STATION_STAFF: 'Recibe cisternas y controla tu tanque.',
  LAB: 'Calidad y certificados del lote.',
  AUDITOR: 'Investiga discrepancias y cierra casos.',
  VERIFIER: 'Supervisa la red de surtidores (ANH).',
  CITIZEN: 'Consulta cantidad y calidad en el mapa.',
};

export function isAppRole(role: string | undefined | null): role is AppRole {
  return Boolean(role && role in NAV_BY_ROLE);
}

export function navForRole(role: string | undefined | null): NavItem[] {
  if (!isAppRole(role)) return [{ href: '/mapa', label: 'Cochabamba' }];
  const allowed = new Set(NAV_BY_ROLE[role]);
  return ALL_NAV.filter((n) => allowed.has(n.href));
}

export function homeForRole(role: string | undefined | null): string {
  if (!isAppRole(role)) return '/mapa';
  return HOME_BY_ROLE[role];
}

export function roleBlurb(role: string | undefined | null): string {
  if (!isAppRole(role)) return 'Consulta pública DEMO.';
  return ROLE_BLURB[role];
}

export function canAccessPath(
  role: string | undefined | null,
  pathname: string,
): boolean {
  if (!isAppRole(role)) return false;
  if (role === 'ADMIN') return true;
  const allowed = ROUTES_BY_ROLE[role];
  return allowed.some(
    (p) =>
      pathname === p ||
      (p !== '/' && pathname.startsWith(`${p}/`)) ||
      (p === '/' && pathname === '/'),
  );
}

/** Quién puede emitir / simular despachos (UI). */
export function canDispatchFuel(role: string | undefined | null): boolean {
  return (
    role === 'ADMIN' ||
    role === 'TRANSPORTER' ||
    role === 'DEPOT_OPERATOR'
  );
}

/** Quién confirma recepción en estación (UI). */
export function canAcceptCustody(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'STATION_STAFF';
}

/** Quién crea lotes de importación (UI). */
export function canCreateBatch(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'IMPORTER';
}

/** Quién trabaja casos de auditoría (UI). */
export function canWriteAudit(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'AUDITOR';
}

/** Quién cambia estado de discrepancias (UI). */
export function canResolveAnomaly(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'AUDITOR';
}

/** Quién ancla evidencia on-chain (UI). */
export function canAnchorEvidence(role: string | undefined | null): boolean {
  return (
    role === 'ADMIN' || role === 'AUDITOR' || role === 'IMPORTER'
  );
}
