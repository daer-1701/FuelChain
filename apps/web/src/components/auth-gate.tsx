'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

const PUBLIC = ['/login', '/mapa', '/cochabamba'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
    }
    if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [ready, user, isPublic, pathname, router]);

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
