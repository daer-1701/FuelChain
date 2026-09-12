'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { safeInternalPath } from '@/lib/safe-next';

const PUBLIC = ['/login', '/mapa', '/cochabamba', '/q'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPublic = PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const qs = searchParams.toString();
  const here = qs ? `${pathname}?${qs}` : pathname || '/';

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
    if (user && pathname === '/login') {
      router.replace(safeInternalPath(searchParams.get('next')));
    }
  }, [ready, user, isPublic, pathname, here, router, searchParams]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--mute)]">
        Cargando sesión…
      </div>
    );
  }

  if (!user && !isPublic) return null;
  if (user && pathname === '/login') return null;

  return <>{children}</>;
}
