import { errorFromResponse } from '@/lib/api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 0 },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw await errorFromResponse(res, `No se pudo cargar ${path}.`);
  }
  return res.json() as Promise<T>;
}

export { API_URL };
