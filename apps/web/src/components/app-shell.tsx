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
      <header className="border-b-2 border-[var(--ink)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-5 md:px-8 md:py-6">
          <Link
            href={user ? home : isPublicPreview ? pathname : '/login'}
            className="group block min-w-0"
          >
            <span className="font-display text-[clamp(2.4rem,6vw,3.75rem)] font-black leading-[0.9] tracking-tight text-[var(--ink)]">
              FuelChain
            </span>
            <span className="mt-2 block font-display text-xl font-bold tracking-[0.22em] text-[var(--diesel)] md:text-2xl">
              BOLIVIA
            </span>
          </Link>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="fc-stamp text-[var(--mute)]">Datos demo</span>
            {user ? (
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-[var(--mute)]">
                    {user.name} · {roleLabel(user.role)}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="border border-[var(--ink)] px-2 py-1 text-xs font-semibold"
                  >
                    Salir
                  </button>
                </div>
                <p className="max-w-xs text-xs text-[var(--mute)] sm:text-right">
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
                    className="border-2 border-[var(--ink)] px-3 py-1.5 text-xs font-semibold"
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
            className="mx-auto flex max-w-6xl gap-0 overflow-x-auto border-t border-[var(--rail)]/40 px-2 md:px-5"
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
                  className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'text-[var(--ink)] after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-[var(--diesel)]'
                      : 'text-[var(--mute)] hover:text-[var(--ink)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
        {showPublicNav && (
          <nav
            className="mx-auto flex max-w-6xl gap-0 overflow-x-auto border-t border-[var(--rail)]/40 px-2 md:px-5"
            aria-label="Público"
          >
            <Link
              href="/mapa"
              aria-current="page"
              className="relative whitespace-nowrap px-4 py-3 text-sm font-medium text-[var(--ink)] after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-[var(--diesel)]"
            >
              Surtidores Bolivia
            </Link>
            <Link
              href="/login"
              className="relative whitespace-nowrap px-4 py-3 text-sm font-medium text-[var(--mute)] hover:text-[var(--ink)]"
            >
              Acceso operadores
            </Link>
          </nav>
        )}
      </header>

      <main className="fc-reveal mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
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
