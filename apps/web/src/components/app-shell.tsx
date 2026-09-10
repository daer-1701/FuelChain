'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Resumen' },
  { href: '/batches', label: 'Lotes' },
  { href: '/anomalies', label: 'Discrepancias' },
  { href: '/audits', label: 'Auditorías' },
  { href: '/blockchain', label: 'Evidencia' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-[var(--ink)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-5 md:px-8 md:py-6">
          <Link href="/" className="group block min-w-0">
            <span className="font-display text-[clamp(2.4rem,6vw,3.75rem)] font-black leading-[0.9] tracking-tight text-[var(--ink)]">
              FuelChain
            </span>
            <span className="mt-2 block font-display text-xl font-bold tracking-[0.22em] text-[var(--diesel)] md:text-2xl">
              BOLIVIA
            </span>
          </Link>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="fc-stamp text-[var(--mute)]">Datos demo</span>
            <p className="max-w-[16rem] text-sm leading-snug text-[var(--mute)] sm:text-right">
              Cada litro. Cada movimiento. Cada evidencia.
            </p>
          </div>
        </div>
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
      </header>

      <main className="fc-reveal mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
