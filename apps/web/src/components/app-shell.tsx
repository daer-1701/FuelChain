'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider } from '@/components/auth-provider';
import { AuthGate } from '@/components/auth-gate';
import { useAuth } from '@/components/auth-provider';
import { navForRole, homeForRole, roleBlurb } from '@/lib/role-access';
import { roleLabel } from '@/lib/es-labels';
import { PRODUCT_TAGLINE } from '@/lib/product-copy';

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const nav = navForRole(user?.role);
  const home = homeForRole(user?.role);
  const isLogin = pathname === '/login';
  const isPublicMap =
    pathname === '/mapa' || pathname.startsWith('/cochabamba');
  const isPublicBaton = pathname.startsWith('/q/');
  const isPublicPreview = isPublicMap || isPublicBaton;
  const showOperatorNav = Boolean(user) && !isLogin;
  const showPublicNav = !user && isPublicPreview;

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="fc-shell-header">
        <div className="mx-auto flex max-w-[var(--fc-max)] flex-wrap items-end justify-between gap-4 px-5 py-4 md:px-8 md:py-5">
          <Link
            href={user ? home : isPublicPreview ? pathname : '/login'}
            className="group block min-w-0"
          >
            <span className="fc-shell-brand">FuelChain</span>
            <span className="fc-shell-subbrand">BOLIVIA</span>
          </Link>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="fc-stamp text-[var(--mute)]">Datos demo</span>
            {user ? (
              <div className="flex flex-col items-start gap-1.5 sm:items-end">
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="fc-meta">
                    <span className="font-semibold text-[var(--ink)]">
                      {user.name}
                    </span>
                    {' · '}
                    {roleLabel(user.role)}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="fc-btn fc-btn-ghost !px-2.5 !py-1 !text-xs"
                  >
                    Salir
                  </button>
                </div>
                <p className="max-w-xs text-right text-[0.75rem] leading-snug text-[var(--mute)]">
                  {roleBlurb(user.role)}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="max-w-[16rem] text-sm leading-snug text-[var(--mute)] sm:text-right">
                  {PRODUCT_TAGLINE}
                </p>
                {isPublicPreview && (
                  <Link
                    href="/login"
                    className="fc-btn fc-btn-ghost !text-xs"
                  >
                    Acceso operadores
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        {showOperatorNav && (
          <nav
            className="fc-shell-nav mx-auto max-w-[var(--fc-max)] px-1 md:px-4"
            aria-label="Principal"
          >
            {nav.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
        {showPublicNav && (
          <nav
            className="fc-shell-nav mx-auto max-w-[var(--fc-max)] px-1 md:px-4"
            aria-label="Público"
          >
            <Link href="/mapa" aria-current="page">
              Surtidores Bolivia
            </Link>
            <Link href="/login">Acceso operadores</Link>
          </nav>
        )}
      </header>

      <main className="fc-shell-main fc-reveal">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center text-[var(--mute)]">
              Cargando sesión…
            </div>
          }
        >
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellInner>{children}</ShellInner>
    </AuthProvider>
  );
}
