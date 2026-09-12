import fs from 'fs';
import path from 'path';
import hre from 'hardhat';
import { ethers } from 'hardhat';

const HSK_TESTNET_CHAIN_ID = 133;
const HSK_MAINNET_CHAIN_ID = 177;

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function deploymentFileName(networkName: string, chainId: number): string {
  if (networkName === 'localhost' || networkName === 'hardhat' || chainId === 31337) {
    return 'localhost.json';
  }
  if (networkName === 'hskTestnet' || chainId === HSK_TESTNET_CHAIN_ID) {
    return 'hsk-testnet.json';
  }
  if (networkName === 'hskMainnet' || chainId === HSK_MAINNET_CHAIN_ID) {
    return 'hsk-mainnet.json';
  }
  return `${networkName}.json`;
}

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const networkName = hre.network.name;
  const rpcUrl = (hre.network.config as { url?: string }).url ?? '';

  if (chainId === HSK_MAINNET_CHAIN_ID || /mainnet\.hsk\.xyz/i.test(rpcUrl)) {
    if (process.env.ALLOW_HSK_MAINNET !== '1') {
      throw new Error(
        'Refusing HashKey Chain Mainnet without ALLOW_HSK_MAINNET=1 (feria track). Prefer testnet 133 for local demos.',
      );
    }
    console.warn(
      '[DEMO] Deploying to HSK Mainnet (177) — ensure the key has funds and is NOT Hardhat #0.',
    );
  }

  const writer = process.env.BLOCKCHAIN_PRIVATE_KEY?.trim()?.toLowerCase();
  const hardhatAccount0 =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  if (chainId === HSK_TESTNET_CHAIN_ID && writer === hardhatAccount0) {
    throw new Error(
      'Refusing Hardhat account #0 on HSK Testnet. Use a dedicated testnet key in BLOCKCHAIN_PRIVATE_KEY.',
    );
  }

  const fileName = deploymentFileName(networkName, chainId);
  if (fileName === 'localhost.json' && chainId !== 31337) {
    throw new Error(`Refusing to write localhost.json for chainId ${chainId}`);
  }
  if (fileName === 'hsk-testnet.json' && chainId !== HSK_TESTNET_CHAIN_ID) {
    throw new Error(
      `Refusing to write hsk-testnet.json for chainId ${chainId} (expected ${HSK_TESTNET_CHAIN_ID})`,
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log('[DEMO] Network', networkName, 'chainId', chainId);
  console.log('[DEMO] Deployer', shortAddress(deployer.address));

  const Factory = await ethers.getContractFactory('FuelChain');
  const contract = await Factory.deploy();
  const deployTx = contract.deploymentTransaction();
  const txHash = deployTx?.hash ?? null;
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });

  const artifactPath = path.join(
    __dirname,
    '..',
    'artifacts',
    'contracts',
    'FuelChain.sol',
    'FuelChain.json',
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as {
    abi: unknown;
  };

  const deployment = {
    network: networkName,
    chainId,
    contractAddress: address,
    address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: txHash,
    abi: artifact.abi,
    label: 'DEMO',
  };

  const outFile = path.join(outDir, fileName);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log('[DEMO] FuelChain deployed at', address);
  if (txHash) console.log('[DEMO] Transaction', txHash);
  console.log('[DEMO] Wrote', outFile);
  console.log('');
  console.log('Set manually:');
  console.log(`FUELCHAIN_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_FUELCHAIN_CONTRACT_ADDRESS=${address}`);
  if (chainId === HSK_TESTNET_CHAIN_ID) {
    console.log('CHAIN_ID=133');
    console.log('NEXT_PUBLIC_CHAIN_ID=133');
    console.log('NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://testnet-explorer.hsk.xyz');
    console.log('CHAIN_RPC_URL=<same official HSK Testnet RPC from .env.example>');
  } else {
    console.log('CHAIN_ID=31337');
    console.log('NEXT_PUBLIC_CHAIN_ID=31337');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
