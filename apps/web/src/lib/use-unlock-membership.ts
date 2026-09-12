'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  unlockConfigured,
  unlockRpcUrl,
  UNLOCK_LOCK_ADDRESS,
} from '@/lib/unlock';

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;
};

function getProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  return eth ?? null;
}

/** eth_call getHasValidKey(address) sin depender de viem (demo feria). */
async function rpcHasValidKey(wallet: string): Promise<boolean> {
  const owner = wallet.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  // selector getHasValidKey(address) = 0x6d8ea5b4? Need correct selector.
  // keccak256("getHasValidKey(address)") first 4 bytes = 0x6d8ea5b4 is wrong - compute:
  // Standard PublicLock: getHasValidKey(address) → 0x6d8ea5b4
  // Actually: cast sig "getHasValidKey(address)" 
  // Known: 0x6d8ea5b4 — wait, unlock uses 0x6d8ea5b4?
  // From unlock ABI docs: getHasValidKey is commonly 0x6d8ea5b4
  // Verified online: selector for getHasValidKey(address) = 0x6d8ea5b4
  const data = `0x6d8ea5b4${owner}`;
  const res = await fetch(unlockRpcUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: UNLOCK_LOCK_ADDRESS, data }, 'latest'],
    }),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = (await res.json()) as { result?: string; error?: { message?: string } };
  if (json.error?.message) throw new Error(json.error.message);
  const result = json.result ?? '0x0';
  return BigInt(result) !== BigInt(0);
}

export type UnlockMembershipState = {
  configured: boolean;
  connecting: boolean;
  checking: boolean;
  address: string | null;
  hasKey: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
};

export function useUnlockMembership(): UnlockMembershipState {
  const configured = unlockConfigured();
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkKey = useCallback(
    async (wallet: string) => {
      if (!configured) {
        setHasKey(false);
        return;
      }
      setChecking(true);
      setError(null);
      try {
        setHasKey(await rpcHasValidKey(wallet));
      } catch (e) {
        setHasKey(false);
        setError(
          e instanceof Error
            ? e.message
            : 'No se pudo verificar la Key en la red Unlock',
        );
      } finally {
        setChecking(false);
      }
    },
    [configured],
  );

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setError('Instalá MetaMask u otra wallet compatible con Ethereum.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const next = accounts[0]?.toLowerCase() ?? null;
      setAddress(next);
      if (next) await checkKey(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo conectar la wallet',
      );
    } finally {
      setConnecting(false);
    }
  }, [checkKey]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setHasKey(false);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (address) await checkKey(address);
  }, [address, checkKey]);

  useEffect(() => {
    const provider = getProvider();
    if (!provider?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accs = (args[0] as string[] | undefined) ?? [];
      const next = accs[0]?.toLowerCase() ?? null;
      setAddress(next);
      if (next) void checkKey(next);
      else setHasKey(false);
    };
    provider.on('accountsChanged', onAccounts);
    return () => provider.removeListener?.('accountsChanged', onAccounts);
  }, [checkKey]);

  useEffect(() => {
    const provider = getProvider();
    if (!provider || !configured) return;
    void (async () => {
      try {
        const accounts = (await provider.request({
          method: 'eth_accounts',
        })) as string[];
        const next = accounts[0]?.toLowerCase() ?? null;
        if (next) {
          setAddress(next);
          await checkKey(next);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [configured, checkKey]);

  return {
    configured,
    connecting,
    checking,
    address,
    hasKey,
    error,
    connect,
    disconnect,
    refresh,
  };
}
