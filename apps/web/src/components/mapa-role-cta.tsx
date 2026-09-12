'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { homeForRole, roleBlurb } from '@/lib/role-access';

export function MapaRoleCta() {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (!user) {
    return (
      <p className="text-sm text-[var(--mute)]">
        ¿Trabajás en una estación o sos chofer?{' '}
        <Link href="/login" className="text-[var(--diesel)] underline">
          Iniciar sesión
        </Link>
      </p>
    );
  }

  const home = homeForRole(user.role);
  return (
    <p className="text-sm text-[var(--mute)]">
      Sesión <strong>{user.name}</strong> · {roleBlurb(user.role)}{' '}
      <Link href={home} className="text-[var(--diesel)] underline">
        Ir a tu panel ({home})
      </Link>
    </p>
  );
}
