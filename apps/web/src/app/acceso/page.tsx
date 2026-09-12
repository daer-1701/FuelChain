import { UnlockAccessPortal } from '@/components/unlock-access-portal';

export const dynamic = 'force-dynamic';

/** Portal público token-gated (Unlock). No requiere login FuelChain. */
export default function AccesoUnlockPage() {
  return <UnlockAccessPortal />;
}
