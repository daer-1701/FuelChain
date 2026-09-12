/**
 * Unlock Protocol — membresía onchain para el portal token-gated.
 * Separado de HSK: HSK = evidencia del recorrido; Unlock = acceso al informe.
 *
 * Redes recomendadas (Unlock desplegado): Base (8453) o Base Sepolia (84532).
 * Crear Lock gratis en https://app.unlock-protocol.com
 */

export const UNLOCK_LOCK_ADDRESS = (
  process.env.NEXT_PUBLIC_UNLOCK_LOCK_ADDRESS ?? ''
).trim();

export const UNLOCK_NETWORK = Number(
  process.env.NEXT_PUBLIC_UNLOCK_NETWORK ?? '84532',
);

/** RPC público para eth_call getHasValidKey. Override en .env si hace falta. */
export function unlockRpcUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_UNLOCK_RPC_URL?.trim();
  if (fromEnv) return fromEnv;
  if (UNLOCK_NETWORK === 8453) return 'https://mainnet.base.org';
  if (UNLOCK_NETWORK === 84532) return 'https://sepolia.base.org';
  if (UNLOCK_NETWORK === 11155111) return 'https://rpc.sepolia.org';
  if (UNLOCK_NETWORK === 137) return 'https://polygon-rpc.com';
  return 'https://sepolia.base.org';
}

export const UNLOCK_NETWORK_LABEL: Record<number, string> = {
  8453: 'Base',
  84532: 'Base Sepolia',
  11155111: 'Sepolia',
  137: 'Polygon',
  10: 'Optimism',
};

export function unlockConfigured(): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(UNLOCK_LOCK_ADDRESS);
}

/** ABI mínimo PublicLock — getHasValidKey / balanceOf. */
export const publicLockAbi = [
  {
    type: 'function',
    name: 'getHasValidKey',
    stateMutability: 'view',
    inputs: [{ name: '_keyOwner', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: '_owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export function unlockCheckoutUrl(redirectUri: string): string {
  if (!unlockConfigured()) return 'https://app.unlock-protocol.com';
  const locks = encodeURIComponent(
    JSON.stringify({
      [UNLOCK_LOCK_ADDRESS]: { network: UNLOCK_NETWORK },
    }),
  );
  return `https://app.unlock-protocol.com/checkout?locks=${locks}&redirectUri=${encodeURIComponent(redirectUri)}`;
}

export function unlockDashboardLockUrl(): string {
  if (!unlockConfigured()) return 'https://app.unlock-protocol.com/locks';
  return `https://app.unlock-protocol.com/locks/lock?address=${UNLOCK_LOCK_ADDRESS}&network=${UNLOCK_NETWORK}`;
}
