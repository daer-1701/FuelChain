/** Minimal ABI for FuelChain.sol — DEMO local Hardhat. */
export const fuelChainAbi = [
  {
    type: 'function',
    name: 'anchorEvidence',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'batchId', type: 'bytes32' },
      { name: 'eventKind', type: 'string' },
      { name: 'dataHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'index', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getAnchorCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getAnchor',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'batchId', type: 'bytes32' },
          { name: 'eventKind', type: 'string' },
          { name: 'dataHash', type: 'bytes32' },
          { name: 'actor', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'event',
    name: 'EvidenceAnchored',
    inputs: [
      { name: 'batchId', type: 'bytes32', indexed: true },
      { name: 'eventKind', type: 'string', indexed: false },
      { name: 'dataHash', type: 'bytes32', indexed: false },
      { name: 'actor', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'anchorIndex', type: 'uint256', indexed: true },
    ],
  },
] as const;
