'use client';

import { getChains, ChainType } from '@lifi/sdk';
import { createPublicClient, http, formatUnits } from 'viem';

const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// USDC addresses from Circle documentation (EVM-compatible testnets only)
const USDC_ADDRESSES: Record<number, string> = {
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  43113: '0x5425890298aed601595a70AB815c96711a31Bc65', // Avalanche Fuji
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Ethereum Sepolia
  11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // OP Sepolia
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // Polygon PoS Amoy
  44787: '0x01C5C0122039549AD1493B8220cABEdD739BC44E', // Celo Sepolia (Alfajores)
  59141: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7', // Linea Sepolia
  1329: '0x4fCF1784B31630811181f670Aea7A7bEF803eaED', // Sei Testnet
  51: '0xb5AB69F7bBada22B28e79C8FFAECe55eF1c771D4', // XDC Apothem
  300: '0xAe045DE5638162fa134807Cb558E15A3F5A7F853', // ZKsync Era Testnet
  11124: '0x31d0220469e10c4E71834a79b5f276d740d3768F', // Unichain Sepolia
  4801: '0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88', // World Chain Sepolia
  98865: '0xcB5f30e335672893c7eb944B374c196392C19D18', // Plume Testnet
  57073: '0xFabab97dCE620294D2B0b0e46C68964e326300Ac', // Ink Testnet
  64165: '0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51', // Sonic Testnet
  57054: '0x2B3370eE501B4a559b57D449569354196457D8Ab', // HyperEVM Testnet
  41455: '0x534b2f3A21130d7a60830c2Df862319e593943A3', // Monad Testnet
  10142: '0x6d7f141b6819C2c9CC2f818e6ad549E7Ca090F8f', // Codex Testnet
  5042002: '0x3600000000000000000000000000000000000000', // Arc Testnet
};

export interface ChainWithBalance {
  id: number;
  name: string;
  usdc: string;
  balance: string;
  type: 'ZK' | 'L2';
  rpc: string;
}

export async function getChainsWithBalance(
  address: string
): Promise<ChainWithBalance[]> {
  try {
    const allChains = await getChains({ chainTypes: [ChainType.EVM] });
    const chainsWithBalance: ChainWithBalance[] = [];

    for (const chain of allChains) {
      const usdcAddress = USDC_ADDRESSES[chain.id];
      if (!usdcAddress) continue;

      const rpc = chain.metamask?.rpcUrls?.[0];
      if (!rpc) continue;

      try {
        const client = createPublicClient({
          transport: http(rpc, { timeout: 10000, retryCount: 2 }),
        });

        const balance = await client.readContract({
          address: usdcAddress as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });

        const formatted = formatUnits(balance, 6);
        if (parseFloat(formatted) > 0) {
          chainsWithBalance.push({
            id: chain.id,
            name: chain.name,
            usdc: usdcAddress,
            balance: formatted,
            type: chain.name.toLowerCase().includes('zk') ? 'ZK' : 'L2',
            rpc,
          });
        }
      } catch (error) {
        console.warn(`Failed to check balance on ${chain.name}:`, error);
      }
    }

    return chainsWithBalance.sort(
      (a, b) => parseFloat(b.balance) - parseFloat(a.balance)
    );
  } catch (error) {
    console.error('Failed to get chains with balance:', error);
    return [];
  }
}