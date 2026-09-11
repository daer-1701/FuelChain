import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

function applyEnvFile(filePath: string): void {
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

/** Load monorepo root .env before Nest/Prisma boot. */
export function loadRootEnv(): string | null {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '..', '.env'),
    resolve(__dirname, '..', '..', '..', '..', '.env'),
    join(process.cwd(), '..', '..', '.env'),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      applyEnvFile(p);
      return p;
    } catch {
      // try next
    }
  }
  return null;
}
