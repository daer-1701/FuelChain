import { deploymentFileForChainId } from './viem-chain';

describe('deploymentFileForChainId', () => {
  it('keeps localhost and HSK testnet files separate', () => {
    expect(deploymentFileForChainId(31337)).toBe('localhost.json');
    expect(deploymentFileForChainId(133)).toBe('hsk-testnet.json');
  });
});
