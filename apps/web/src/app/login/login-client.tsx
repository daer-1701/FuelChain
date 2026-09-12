'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { safeInternalPath } from '@/lib/safe-next';
import { canAccessPath, homeForRole } from '@/lib/role-access';
import { friendlyError } from '@/lib/api-error';

/** Operadores DEMO (ciudadano entra por Ver surtidores / mapa). */
const PRESETS = [
  {
    email: 'chofer@fuelchain.bo',
    role: 'Chofer',
    blurb: 'Registrá el viaje de la cisterna',
  },
  {
    email: 'estacion@fuelchain.bo',
    role: 'Estación (EESS)',
    blurb: 'Tanque, cisternas y contratos de tu surtidor',
  },
  {
    email: 'anh@fuelchain.bo',
    role: 'ANH',
    blurb: 'Verificá todos los movimientos',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [email, setEmail] = useState('chofer@fuelchain.bo');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const hint = useMemo(() => 'Contraseña DEMO: demo123', []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    start(async () => {
      setError(null);
      try {
        const sessionUser = await login(email, password);
        const requested = safeInternalPath(next);
        const dest =
          requested &&
          requested !== '/' &&
          requested !== '/login' &&
          canAccessPath(sessionUser.role, requested)
            ? requested
            : homeForRole(sessionUser.role);
        router.replace(dest);
      } catch (err) {
        setError(friendlyError(err, 'Error de login'));
      }
    });
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr]">
      <header className="max-w-lg">
        <p className="fc-stamp text-[var(--mute)]">Cochabamba · acceso DEMO</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight md:text-5xl">
          FuelChain
        </h1>
        <p className="mt-2 font-display text-lg font-bold tracking-[0.18em] text-[var(--diesel)]">
          BOLIVIA
        </p>
        <p className="mt-4 leading-relaxed text-[var(--mute)]">
          Cuatro actores: chofer registra el viaje, estación controla su tanque,
          ANH verifica movimientos, ciudadano consulta el mapa.
        </p>

        <Link
          href="/mapa"
          className="mt-8 inline-flex w-full items-center justify-center bg-[var(--diesel)] px-5 py-4 text-center font-display text-lg font-bold text-[var(--paper)] transition-opacity hover:opacity-90 sm:w-auto"
        >
          Ver surtidores
        </Link>
        <p className="mt-2 text-sm text-[var(--mute)]">
          Mapa público · cantidad y calidad DEMO
        </p>
      </header>

      <div className="space-y-6">
        <form onSubmit={onSubmit} className="fc-sheet space-y-4">
          <h2 className="font-display text-xl font-bold">Acceso operadores</h2>
          <p className="text-sm text-[var(--mute)]">{hint}</p>
          <label className="block text-sm">
            Correo
            <input
              className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block text-sm">
            Contraseña
            <input
              type="password"
              className="mt-1 w-full border border-[var(--ink)] bg-transparent px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-[var(--alarm)]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--paper)] disabled:opacity-50"
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="grid gap-2 sm:grid-cols-2">
          {PRESETS.map((p) => (
            <button
              key={p.email}
              type="button"
              className="border border-[var(--rail)]/50 px-3 py-3 text-left transition-colors hover:border-[var(--ink)]"
              onClick={() => {
                setEmail(p.email);
                setPassword('demo123');
              }}
            >
              <span className="block font-display text-sm font-bold">
                {p.role}
              </span>
              <span className="mt-1 block text-xs text-[var(--mute)]">
                {p.blurb}
              </span>
              <span className="mt-1 block text-[10px] text-[var(--mute)]">
                {p.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
