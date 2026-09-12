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
 * Menú visible. Foco: trazabilidad del camino + cantidad/calidad por tramo.
 * - Estación: tanque + tramos hacia su EESS + recepción QR
 * - Chofer: emite viaje + registra tramos (litros/calidad/GPS)
 * - ANH: verifica movimientos y el camino completo
 * - Ciudadano: mapa (resultado en surtidor)
 * Legacy no en login DEMO.
 */
const ALL_NAV: NavItem[] = [
  { href: '/supervision', label: 'Movimientos' },
  { href: '/acceso', label: 'Acceso Unlock' },
  { href: '/estacion', label: 'Mi estación' },
  { href: '/escanear', label: 'Escanear QR' },
  { href: '/mi-qr', label: 'Mi QR' },
  { href: '/qr-prueba', label: '50 QR cisterna' },
  { href: '/verify', label: 'Registrar viaje' },
  { href: '/tramos', label: 'Tramos del viaje' },
  { href: '/simular', label: 'Simular entrega' },
  { href: '/mapa', label: 'Bolivia' },
  { href: '/', label: 'Resumen' },
  { href: '/batches', label: 'Lotes' },
  { href: '/anomalies', label: 'Discrepancias' },
  { href: '/audits', label: 'Auditorías' },
  { href: '/blockchain', label: 'Evidencia' },
];

const NAV_BY_ROLE: Record<AppRole, string[]> = {
  ADMIN: ALL_NAV.map((n) => n.href),
  STATION_STAFF: ['/estacion', '/escanear', '/tramos'],
  TRANSPORTER: ['/verify', '/mi-qr', '/tramos', '/simular'],
  VERIFIER: ['/supervision', '/tramos', '/blockchain'],
  CITIZEN: ['/mapa'],
  DEPOT_OPERATOR: ['/verify', '/mi-qr', '/tramos', '/simular'],
  IMPORTER: ['/batches', '/mapa', '/blockchain'],
  LAB: ['/batches'],
  AUDITOR: ['/supervision', '/tramos', '/blockchain', '/anomalies', '/audits'],
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
  STATION_STAFF: [
    '/estacion',
    '/escanear',
    '/tramos',
    '/q',
    '/c',
  ],
  TRANSPORTER: [
    '/verify',
    '/simular',
    '/tramos',
    '/mi-qr',
    '/q',
    '/c',
  ],
  VERIFIER: [
    '/supervision',
    '/tramos',
    '/blockchain',
    '/acceso',
  ],
  CITIZEN: ['/mapa', '/acceso'],
  DEPOT_OPERATOR: [
    '/verify',
    '/simular',
    '/tramos',
    '/mi-qr',
    '/q',
    '/c',
  ],
  IMPORTER: ['/batches', '/mapa', '/blockchain'],
  LAB: ['/batches'],
  AUDITOR: [
    '/supervision',
    '/tramos',
    '/blockchain',
    '/acceso',
    '/anomalies',
    '/audits',
    '/mapa',
    '/batches',
  ],
};

export const ROLE_BLURB: Record<AppRole, string> = {
  ADMIN: 'Acceso completo DEMO.',
  STATION_STAFF:
    'Tu EESS: tanque, escanear QR de cisterna y verificar litros/calidad al recibir.',
  TRANSPORTER:
    'Registrás el camino: QR con litros/calidad de carga y tramos GPS hasta la estación.',
  VERIFIER:
    'ANH: verificás cantidad, calidad y el recorrido completo de cada cisterna.',
  CITIZEN: 'Ves en el mapa el resultado: cantidad y calidad en el surtidor.',
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
  if (!isAppRole(role)) return [{ href: '/mapa', label: 'Bolivia' }];
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
