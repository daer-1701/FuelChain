import { Suspense } from 'react';
import LoginPage from './login-client';

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <p className="text-[var(--mute)]">Cargando acceso…</p>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
