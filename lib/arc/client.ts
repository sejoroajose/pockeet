import { createPublicClient, http, type Address } from 'viem';
import type { Chain } from 'viem';


export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://explorer.testnet.arc.network',
    },
  },
  testnet: true,
} as const satisfies Chain;

export const arcPublicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Get USDC contract address
export function getUSDCAddress(): Address {
  return (process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS || 
    '0x3600000000000000000000000000000000000000') as Address;
}

// Get Arc native (ETH) balance
export async function getArcNativeBalance(address: Address): Promise<bigint> {
  try {
    const balance = await arcPublicClient.getBalance({ address });
    return balance;
  } catch (error) {
    console.error('Failed to get Arc native balance:', error);
    return 0n;
  }
}

// Get USDC balance on Arc
export async function getArcUSDCBalance(address: Address): Promise<bigint> {
  try {
    const usdcAddress = getUSDCAddress();
    
    const balance = await arcPublicClient.readContract({
      address: usdcAddress,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [address],
    });
    
    return balance as bigint;
  } catch (error) {
    console.error('Failed to get Arc USDC balance:', error);
    return 0n;
  }
}

// Format Arc amount 
export function formatArcAmount(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(4);
}

// Format USDC amount 
export function formatUSDCAmount(amount: bigint): string {
  return (Number(amount) / 1e6).toFixed(2);
}

export default {
  arcTestnet,
  arcPublicClient,
  getUSDCAddress,
  getArcNativeBalance,
  getArcUSDCBalance,
  formatArcAmount,
  formatUSDCAmount,
};