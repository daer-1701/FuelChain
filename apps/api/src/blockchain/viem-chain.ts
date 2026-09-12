import { defineChain, type Chain } from 'viem';
import { hardhat } from 'viem/chains';

/** viem chain from env. RPC/address stay in env — no hardcoded HSK URL. */
export function chainFromEnv(): Chain {
  const id = Number(process.env.CHAIN_ID || 31337);
  if (id === 31337) return hardhat;

  const rpc = process.env.CHAIN_RPC_URL?.trim();
  if (!rpc) {
    throw new Error('CHAIN_RPC_URL is required when CHAIN_ID is not 31337');
  }

  return defineChain({
    id,
    name: id === 133 ? 'HashKey Chain Testnet' : `chain-${id}`,
    nativeCurrency: {
      decimals: 18,
      name: id === 133 ? 'HashKey EcoPoints' : 'native',
      symbol: id === 133 ? 'HSK' : 'ETH',
    },
    rpcUrls: {
      default: { http: [rpc] },
    },
  });
}

export function deploymentFileForChainId(chainId: number): string {
  if (chainId === 31337) return 'localhost.json';
  if (chainId === 133) return 'hsk-testnet.json';
  return `chain-${chainId}.json`;
}
