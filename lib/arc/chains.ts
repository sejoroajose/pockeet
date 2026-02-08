import { type Chain } from 'viem';
import { sepolia, baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy, avalancheFuji } from 'viem/chains';

export interface CCTPChainConfig {
  chain: Chain;
  domain: number;
  tokenMessenger: `0x${string}`;
  messageTransmitter: `0x${string}`;
  usdcAddress: `0x${string}`;
  rpcUrl: string; 
}

export const CCTP_CHAINS: Record<string, CCTPChainConfig> = {
  sepolia: {
    chain: sepolia,
    domain: 0,
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    rpcUrl: 'https://ethereum-sepolia-public.nodies.app',
  },
  baseSepolia: {
    chain: baseSepolia,
    domain: 6,
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
  },
  arbitrumSepolia: {
    chain: arbitrumSepolia,
    domain: 3,
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    rpcUrl: 'https://arbitrum-sepolia-rpc.publicnode.com',
  },
  optimismSepolia: {
    chain: optimismSepolia,
    domain: 2,
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    rpcUrl: 'https://optimism-sepolia-public.nodies.app',
  },
  polygonAmoy: {
    chain: polygonAmoy,
    domain: 7,
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    usdcAddress: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582',
    rpcUrl: 'https://polygon-amoy.gateway.tenderly.co',
  },
  avalancheFuji: {
    chain: avalancheFuji,
    domain: 1,
    tokenMessenger: '0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0',
    messageTransmitter: '0xa9fB1b3009DCb79E2fe346c16a604B8Fa8aE0a79',
    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65',
    rpcUrl: 'https://avalanche-fuji.drpc.org',
  },
};

export const SUI_DOMAIN = 8;

export function getCCTPChain(chainId: number): CCTPChainConfig | undefined {
  return Object.values(CCTP_CHAINS).find(c => c.chain.id === chainId);
}

export function getAllSupportedChains(): CCTPChainConfig[] {
  return Object.values(CCTP_CHAINS);
}