'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { safeInternalPath } from '@/lib/safe-next';
import { canAccessPath, homeForRole } from '@/lib/role-access';
import { friendlyError } from '@/lib/api-error';
import { PRODUCT_FOCUS, PATH_STEPS } from '@/lib/product-copy';

/** Operadores DEMO (ciudadano entra por Ver surtidores / mapa). */
const PRESETS = [
  {
    email: 'chofer@fuelchain.bo',
    role: 'Chofer',
    blurb: 'Litros, calidad y tramos del camino',
  },
  {
    email: 'estacion@fuelchain.bo',
    role: 'Estación (EESS)',
    blurb: 'Verificá cantidad y calidad al recibir',
  },
  {
    email: 'anh@fuelchain.bo',
    role: 'ANH',
    blurb: 'Auditá el recorrido completo de la red',
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
        setError(friendlyError(err, 'No se pudo iniciar sesión'));
      }
    });
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr]">
      <header className="fc-page-header max-w-lg">
        <p className="fc-stamp text-[var(--mute)]">Bolivia · acceso DEMO</p>
        <h1 className="fc-title fc-title-lg mt-2">
          FuelChain
        </h1>
        <p className="fc-shell-subbrand !mt-2 !text-lg">BOLIVIA</p>
        <p className="fc-lede">
          {PRODUCT_FOCUS} {PATH_STEPS}. Chofer registra, estación verifica al
          recibir, ANH audita la red, ciudadano consulta el mapa.
        </p>

        <Link
          href="/mapa"
          className="fc-btn mt-8 inline-flex w-full !px-5 !py-3.5 font-display !text-base !font-bold sm:w-auto"
        >
          Ver surtidores
        </Link>
        <p className="fc-meta mt-2">
          Mapa público · resultado de cantidad y calidad en el surtidor
        </p>
      </header>

      <div className="space-y-6">
        <form onSubmit={onSubmit} className="fc-sheet space-y-4">
          <h2 className="fc-section-title">Acceso operadores</h2>
          <p className="fc-meta">{hint}</p>
          <label className="fc-label">
            Correo
            <input
              className="fc-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="fc-label">
            Contraseña
            <input
              type="password"
              className="fc-field"
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
            className="fc-btn fc-btn-ink w-full !py-3"
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="grid gap-2 sm:grid-cols-2">
          {PRESETS.map((p) => (
            <button
              key={p.email}
              type="button"
              className="border border-[var(--rail)]/55 bg-[var(--paper)] px-3 py-3 text-left transition-colors hover:border-[var(--ink)]"
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
              <span className="mt-1 block font-mono text-[10px] text-[var(--mute)]">
                {p.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
