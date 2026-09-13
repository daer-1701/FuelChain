import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import fs from 'fs';
import path from 'path';

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, '..', '.env'));
loadEnvFile(path.join(__dirname, '.env'));

function hskRpcUrl(): string {
  if (process.env.HSK_TESTNET_RPC_URL) return process.env.HSK_TESTNET_RPC_URL;
  const rpc = process.env.CHAIN_RPC_URL || '';
  if (/127\.0\.0\.1|localhost/i.test(rpc)) return '';
  return rpc;
}

const hskRpc = hskRpcUrl();
const hskChainId = Number(process.env.HSK_TESTNET_CHAIN_ID || '133');
const writerKey = process.env.BLOCKCHAIN_PRIVATE_KEY?.trim();
/** Solo claves de 32 bytes (64 hex). Evita HH8 si .env tiene una address por error. */
const writerAccounts =
  writerKey && /^0x[0-9a-fA-F]{64}$/.test(writerKey) ? [writerKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: process.env.CHAIN_RPC_URL || 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    hskTestnet: {
      url: hskRpc || 'http://127.0.0.1:8545',
      chainId: hskChainId,
      accounts: writerAccounts,
    },
    hskMainnet: {
      url:
        process.env.HSK_MAINNET_RPC_URL ||
        process.env.CHAIN_RPC_URL ||
        'http://127.0.0.1:8545',
      chainId: 177,
      accounts: writerAccounts,
    },
  },
};

export default config;
