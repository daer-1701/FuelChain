function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Web deep-link that still carries the signed payload for offline scan. */
export function batonDeepLink(
  origin: string,
  tokenId: string,
  payload: unknown,
): string {
  const p = toBase64Url(JSON.stringify(payload));
  return `${origin}/q/${tokenId}?p=${p}`;
}

export function parseBatonPayloadParam(
  raw: string | null,
): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
