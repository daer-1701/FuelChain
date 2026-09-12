'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { safeInternalPath } from '@/lib/safe-next';
import { canAccessPath, homeForRole } from '@/lib/role-access';

/** Visibles sin sesión. Con sesión, el rol debe poder acceder (salvo /login). */
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
  const roleBlocked =
    Boolean(user) &&
    pathname !== '/login' &&
    !canAccessPath(user!.role, pathname);

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (user && pathname === '/login') {
      const next = searchParams.get('next');
      const requested = safeInternalPath(next);
      const dest =
        requested &&
        requested !== '/login' &&
        requested !== '/' &&
        canAccessPath(user.role, requested)
          ? requested
          : homeForRole(user.role);
      router.replace(dest);
      return;
    }
    // Incluye /mapa público: estación no ve la red completa.
    if (roleBlocked) {
      router.replace(homeForRole(user!.role));
    }
  }, [ready, user, isPublic, pathname, here, router, searchParams, roleBlocked]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--mute)]">
        Cargando sesión…
      </div>
    );
  }

  if (!user && !isPublic) return null;
  if (user && pathname === '/login') return null;
  if (roleBlocked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--mute)]">
        Redirigiendo a tu panel…
      </div>
    );
  }

  return <>{children}</>;
}
