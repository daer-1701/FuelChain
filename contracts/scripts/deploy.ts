import fs from 'fs';
import path from 'path';
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('[DEMO] Deploying FuelChain with', deployer.address);

  const Factory = await ethers.getContractFactory('FuelChain');
  const contract = await Factory.deploy();
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
    network: 'localhost',
    chainId: 31337,
    address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
    label: 'DEMO',
  };

  const outFile = path.join(outDir, 'localhost.json');
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));
  console.log('[DEMO] FuelChain deployed at', address);
  console.log('[DEMO] Wrote', outFile);
  console.log('[DEMO] Set in .env:');
  console.log(`FUELCHAIN_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_FUELCHAIN_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
