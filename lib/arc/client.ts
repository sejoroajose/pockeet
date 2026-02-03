import { createPublicClient, createWalletClient, http, type Address, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Chain } from 'viem';

// Arc Testnet Chain
export const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://explorer.testnet.arc.network',
    },
  },
  testnet: true,
};

// Create public client
export const arcPublicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Create wallet client (backend only - requires private key)
export function createArcWalletClient() {
  const privateKey = process.env.ARC_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    throw new Error('ARC_PRIVATE_KEY not set');
  }

  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  });
}

// Get USDC contract address
export function getUSDCAddress(): Address {
  return (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as Address;
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

// Check USDC allowance
export async function getUSDCAllowance(
  owner: Address,
  spender: Address
): Promise<bigint> {
  try {
    const usdcAddress = getUSDCAddress();
    
    const allowance = await arcPublicClient.readContract({
      address: usdcAddress,
      abi: [
        {
          name: 'allowance',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
          ],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'allowance',
      args: [owner, spender],
    });
    
    return allowance as bigint;
  } catch (error) {
    console.error('Failed to get USDC allowance:', error);
    return 0n;
  }
}

// Approve USDC spending
export async function approveUSDC(
  spender: Address,
  amount: bigint
): Promise<Hash> {
  const walletClient = createArcWalletClient();
  const usdcAddress = getUSDCAddress();
  
  const hash = await walletClient.writeContract({
    address: usdcAddress,
    abi: [
      {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
    ],
    functionName: 'approve',
    args: [spender, amount],
  });
  
  await arcPublicClient.waitForTransactionReceipt({ hash });
  
  return hash;
}

// Transfer USDC
export async function transferUSDC(
  to: Address,
  amount: bigint
): Promise<Hash> {
  const walletClient = createArcWalletClient();
  const usdcAddress = getUSDCAddress();
  
  const hash = await walletClient.writeContract({
    address: usdcAddress,
    abi: [
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
    ],
    functionName: 'transfer',
    args: [to, amount],
  });
  
  await arcPublicClient.waitForTransactionReceipt({ hash });
  
  return hash;
}

// Get block number
export async function getBlockNumber(): Promise<bigint> {
  return arcPublicClient.getBlockNumber();
}

// Get transaction receipt
export async function getTransactionReceipt(hash: Hash) {
  return arcPublicClient.getTransactionReceipt({ hash });
}

// Format Arc amount (18 decimals)
export function formatArcAmount(amount: bigint): string {
  return (Number(amount) / 1e18).toFixed(4);
}

// Format USDC amount (6 decimals)
export function formatUSDCAmount(amount: bigint): string {
  return (Number(amount) / 1e6).toFixed(2);
}

export default {
  arcTestnet,
  arcPublicClient,
  createArcWalletClient,
  getUSDCAddress,
  getArcNativeBalance,
  getArcUSDCBalance,
  getUSDCAllowance,
  approveUSDC,
  transferUSDC,
  getBlockNumber,
  getTransactionReceipt,
  formatArcAmount,
  formatUSDCAmount,
};