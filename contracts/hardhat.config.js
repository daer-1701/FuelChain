require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {},
    localhost: {
      url: process.env.CHAIN_RPC_URL || "http://127.0.0.1:8545",
      chainId: Number(process.env.CHAIN_ID || 31337),
    },
  },
};
