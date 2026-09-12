/** UI navigation — producto FuelChain = 4 actores DEMO. */

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

/**
 * Menú visible. Producto confirmado:
 * - Estación: tanque + cisternas propias + contratos
 * - Chofer: registra viaje (QR/simular) + contratos
 * - ANH: verifica todos los movimientos
 * - Ciudadano: mapa
 * Roles legacy (importador, depósito, lab, auditor) quedan con acceso mínimo.
 */
const ALL_NAV: NavItem[] = [
  { href: '/supervision', label: 'Movimientos' },
  { href: '/estacion', label: 'Mi estación' },
  { href: '/verify', label: 'Registrar viaje' },
  { href: '/tramos', label: 'Tramos GPS' },
  { href: '/simular', label: 'Simular entrega' },
  { href: '/contratos', label: 'Contratos' },
  { href: '/mapa', label: 'Cochabamba' },
  { href: '/', label: 'Resumen' },
  { href: '/batches', label: 'Lotes' },
  { href: '/anomalies', label: 'Discrepancias' },
  { href: '/audits', label: 'Auditorías' },
  { href: '/blockchain', label: 'Evidencia' },
];

const NAV_BY_ROLE: Record<AppRole, string[]> = {
  ADMIN: ALL_NAV.map((n) => n.href),
  STATION_STAFF: ['/estacion', '/contratos', '/tramos'],
  TRANSPORTER: ['/verify', '/tramos', '/simular', '/contratos'],
  VERIFIER: ['/supervision', '/tramos', '/mapa'],
  CITIZEN: ['/mapa'],
  DEPOT_OPERATOR: ['/verify', '/tramos', '/simular', '/contratos'],
  IMPORTER: ['/batches', '/mapa', '/blockchain'],
  LAB: ['/batches'],
  AUDITOR: ['/supervision', '/tramos', '/anomalies', '/audits'],
};

export const HOME_BY_ROLE: Record<AppRole, string> = {
  ADMIN: '/supervision',
  STATION_STAFF: '/estacion',
  TRANSPORTER: '/verify',
  VERIFIER: '/supervision',
  CITIZEN: '/mapa',
  DEPOT_OPERATOR: '/verify',
  IMPORTER: '/batches',
  LAB: '/batches',
  AUDITOR: '/supervision',
};

const ROUTES_BY_ROLE: Record<AppRole, string[]> = {
  ADMIN: ['/'],
  STATION_STAFF: ['/estacion', '/contratos', '/tramos', '/q'],
  TRANSPORTER: ['/verify', '/simular', '/contratos', '/tramos', '/q'],
  VERIFIER: ['/supervision', '/mapa', '/tramos'],
  CITIZEN: ['/mapa'],
  DEPOT_OPERATOR: ['/verify', '/simular', '/contratos', '/tramos', '/q'],
  IMPORTER: ['/batches', '/mapa', '/blockchain'],
  LAB: ['/batches'],
  AUDITOR: [
    '/supervision',
    '/tramos',
    '/anomalies',
    '/audits',
    '/mapa',
    '/batches',
  ],
};

export const ROLE_BLURB: Record<AppRole, string> = {
  ADMIN: 'Acceso completo DEMO.',
  STATION_STAFF:
    'Tu EESS: tanque, cisternas en camino y contratos con el chofer.',
  TRANSPORTER: 'Registrás el viaje de la cisterna y acordás con el surtidor.',
  VERIFIER: 'ANH: verificás todos los movimientos de la red.',
  CITIZEN: 'Consulta cantidad y calidad en el mapa.',
  DEPOT_OPERATOR: 'Legacy DEMO — usá el perfil chofer.',
  IMPORTER: 'Legacy DEMO — fuera del núcleo de 4 actores.',
  LAB: 'Legacy DEMO — calidad queda en el pasaporte.',
  AUDITOR: 'Legacy DEMO — la verificación la hace ANH.',
};

/** Roles que se muestran en login DEMO. */
export const DEMO_LOGIN_ROLES = [
  'TRANSPORTER',
  'STATION_STAFF',
  'VERIFIER',
  'CITIZEN',
] as const;

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

export function canDispatchFuel(role: string | undefined | null): boolean {
  return (
    role === 'ADMIN' ||
    role === 'TRANSPORTER' ||
    role === 'DEPOT_OPERATOR'
  );
}

export function canAcceptCustody(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'STATION_STAFF';
}

export function canManageContracts(role: string | undefined | null): boolean {
  return (
    role === 'ADMIN' ||
    role === 'STATION_STAFF' ||
    role === 'TRANSPORTER' ||
    role === 'DEPOT_OPERATOR'
  );
}

export function canWriteCheckpoint(role: string | undefined | null): boolean {
  return (
    role === 'ADMIN' ||
    role === 'TRANSPORTER' ||
    role === 'DEPOT_OPERATOR'
  );
}

export function canReadCheckpoint(role: string | undefined | null): boolean {
  return (
    role === 'ADMIN' ||
    role === 'TRANSPORTER' ||
    role === 'DEPOT_OPERATOR' ||
    role === 'STATION_STAFF' ||
    role === 'VERIFIER' ||
    role === 'AUDITOR'
  );
}

export function canCreateBatch(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'IMPORTER';
}

export function canWriteAudit(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'AUDITOR' || role === 'VERIFIER';
}

export function canResolveAnomaly(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'AUDITOR' || role === 'VERIFIER';
}

export function canAnchorEvidence(role: string | undefined | null): boolean {
  return (
    role === 'ADMIN' || role === 'AUDITOR' || role === 'IMPORTER'
  );
}
