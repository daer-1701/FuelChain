const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FuelChain", function () {
  it("anchors custody evidence and requires a successful receipt", async function () {
    const [signer] = await ethers.getSigners();
    const FuelChain = await ethers.getContractFactory("FuelChain");
    const contract = await FuelChain.deploy();
    await contract.waitForDeployment();

    const batchId = ethers.id("batch-cuid-demo");
    const dataHash = ethers.id("fuelchain.custody.received.v1");

    const tx = await contract.anchorEvidence(
      batchId,
      "CustodyEventRegistered",
      dataHash,
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    expect(await contract.getAnchorCount()).to.equal(1n);
    const anchor = await contract.getAnchor(0);
    expect(anchor.batchId).to.equal(batchId);
    expect(anchor.eventKind).to.equal("CustodyEventRegistered");
    expect(anchor.dataHash).to.equal(dataHash);
    expect(anchor.actor).to.equal(signer.address);
  });
});
