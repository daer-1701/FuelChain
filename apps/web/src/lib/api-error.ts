/**
 * Convierte respuestas Nest/JSON o Error crudos en mensajes legibles (ES).
 */

const KNOWN: Record<string, string> = {
  'Batch not found':
    'Lote no encontrado. Elegí uno de la lista DEMO (181, 182 o 184).',
  'Not Found': 'No se encontró el recurso solicitado.',
  Unauthorized: 'Sesión inválida o sin permiso. Volvé a iniciar sesión.',
  Forbidden: 'No tenés permiso para esta acción con tu rol.',
  'Sin sesión': 'Necesitás iniciar sesión para continuar.',
  'Operador de estación sin EESS asignada':
    'Tu usuario de estación no tiene EESS asignada.',
  'Sin cisterna asignada. No se puede registrar el tramo.':
    'Sin cisterna asignada. No se puede registrar el tramo.',
  'Cisterna no encontrada': 'Cisterna no encontrada.',
  'Esta cisterna no está asignada a tu sesión.':
    'Esta cisterna no está asignada a tu sesión.',
  'Lote no encontrado':
    'Lote no encontrado. Elegí uno de la lista DEMO (181, 182 o 184).',
  'No hay lote/despacho activo para este tramo. Emití QR o simulá primero.':
    'No hay despacho activo. Emití QR o simulá una entrega primero.',
};

function translate(msg: string): string {
  const trimmed = msg.trim();
  if (KNOWN[trimmed]) return KNOWN[trimmed];
  for (const [key, es] of Object.entries(KNOWN)) {
    if (trimmed.includes(key)) return es;
  }
  return trimmed;
}

/** Parsea body de error (JSON Nest o texto plano). */
export function formatApiError(
  raw: string,
  fallback = 'Ocurrió un error. Intentá de nuevo.',
): string {
  const text = (raw ?? '').trim();
  if (!text) return fallback;

  try {
    const j = JSON.parse(text) as {
      message?: string | string[];
      error?: string;
      statusCode?: number;
    };
    if (Array.isArray(j.message) && j.message.length) {
      return translate(j.message.map(String).join('. '));
    }
    if (typeof j.message === 'string' && j.message.trim()) {
      return translate(j.message);
    }
    if (typeof j.error === 'string' && j.error.trim()) {
      return translate(j.error);
    }
  } catch {
    if (text.startsWith('{') && text.includes('"message"')) {
      return fallback;
    }
    return translate(text);
  }

  return fallback;
}

/** Lee el body de un Response fallido y arma un Error con mensaje humano. */
export async function errorFromResponse(
  res: Response,
  fallback?: string,
): Promise<Error> {
  const raw = await res.text().catch(() => '');
  const base =
    fallback ??
    (res.status === 404
      ? 'No encontrado.'
      : res.status === 401
        ? 'Sesión inválida. Volvé a iniciar sesión.'
        : res.status === 403
          ? 'No tenés permiso para esta acción.'
          : `Error del servidor (${res.status}).`);
  return new Error(formatApiError(raw, base));
}

/** Extrae mensaje amigable de cualquier throw. */
export function friendlyError(
  err: unknown,
  fallback = 'Ocurrió un error. Intentá de nuevo.',
): string {
  if (err instanceof Error) {
    return formatApiError(err.message, err.message || fallback);
  }
  if (typeof err === 'string') return formatApiError(err, fallback);
  return fallback;
}
