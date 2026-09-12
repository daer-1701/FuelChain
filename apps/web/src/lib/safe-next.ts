/** Only allow same-origin relative paths (blocks //evil.com). */
export function safeInternalPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
  if (next === '/login' || next.startsWith('/login?')) return '/';
  return next;
}
