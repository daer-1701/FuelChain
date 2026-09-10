const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FuelChain", function () {
  it("records an anchor and emits event", async function () {
    const [signer] = await ethers.getSigners();
    const FuelChain = await ethers.getContractFactory("FuelChain");
    const contract = await FuelChain.deploy();
    await contract.waitForDeployment();

    const batchId = ethers.id("FC-BO-2026-000184");
    const dataHash = ethers.id("demo-payload");

    const tx = await contract.recordAnchor(
      batchId,
      "AnomalyRegistered",
      "anomaly-1",
      dataHash,
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    expect(await contract.getAnchorCount(batchId)).to.equal(1n);
    const anchor = await contract.getAnchor(batchId, 0);
    expect(anchor.dataHash).to.equal(dataHash);
    expect(anchor.actor).to.equal(signer.address);
  });
});
