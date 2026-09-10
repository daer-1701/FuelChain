const fs = require("fs");
const path = require("path");

async function main() {
  const FuelChain = await ethers.getContractFactory("FuelChain");
  const contract = await FuelChain.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  const network = await ethers.provider.getNetwork();
  const deployment = {
    address,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    network: "localhost",
    note: "DEMO / local Hardhat — not Mainnet",
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "localhost.json");
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  // Copy ABI next to deployment for the API
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "FuelChain.sol",
    "FuelChain.json",
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.writeFileSync(
    path.join(outDir, "FuelChain.abi.json"),
    JSON.stringify(artifact.abi, null, 2),
  );

  console.log("FuelChain deployed to:", address);
  console.log("Wrote", outFile);
  console.log("");
  console.log("Add to .env / apps env:");
  console.log(`FUELCHAIN_CONTRACT_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_FUELCHAIN_CONTRACT_ADDRESS=${address}`);
  console.log("CHAIN_RPC_URL=http://127.0.0.1:8545");
  console.log("CHAIN_ID=31337");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
