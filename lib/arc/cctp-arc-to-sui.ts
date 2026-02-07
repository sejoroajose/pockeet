import { type Address, type Hash, parseUnits, erc20Abi } from 'viem';
import { arcPublicClient, getUSDCAddress } from './client';
import type { WalletClient } from 'viem';
import { arcTestnet } from './client';

// CCTP Contract addresses on Arc
const TOKEN_MESSENGER = (process.env.NEXT_PUBLIC_ARC_TOKEN_MESSENGER || 
  '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5') as Address;

const SUI_DOMAIN = 8; 

// CCTP TokenMessenger ABI
const TOKEN_MESSENGER_ABI = [
  {
    name: 'depositForBurn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
    ],
    outputs: [{ name: 'nonce', type: 'uint64' }],
  },
] as const;

export interface BridgeResult {
  burnTxHash: Hash;
  amount: string;
  recipient: string;
  attestation?: string;
}

/**
 * Bridge USDC from Arc to Sui using Circle's CCTP
 */
export async function bridgeArcToSui(
  walletClient: WalletClient,
  amount: string,
  suiRecipient: string
): Promise<BridgeResult> {
  if (!walletClient.account) {
    throw new Error('No wallet account connected');
  }

  const usdcAddress = getUSDCAddress();
  const amountWei = parseUnits(amount, 6);
  const recipientBytes32 = suiAddressToBytes32(suiRecipient);
  
  // 1. Approve TokenMessenger to spend USDC
  const { request } = await arcPublicClient.simulateContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [TOKEN_MESSENGER, amountWei],
    account: walletClient.account!,   
    chain: arcTestnet,
  });

  const approveTx = await walletClient.writeContract(request);
  
  await arcPublicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log('Approval confirmed:', approveTx);
  
 const burnSimulation = await arcPublicClient.simulateContract({
    address: TOKEN_MESSENGER,
    abi: TOKEN_MESSENGER_ABI,
    functionName: 'depositForBurn',
    args: [
      amountWei,
      SUI_DOMAIN,
      recipientBytes32,
      usdcAddress,
    ],
    account: walletClient.account,
    chain: arcTestnet,
  });

  console.log('Simulate burn successful. Sending real burn tx...');

  const burnTxHash = await walletClient.writeContract(burnSimulation.request);
  
  await arcPublicClient.waitForTransactionReceipt({ hash: burnTxHash });
  console.log('Burn confirmed:', burnTxHash);
  
  return {
    burnTxHash: burnTxHash,
    amount,
    recipient: suiRecipient,
  };
}

function suiAddressToBytes32(suiAddress: string): `0x${string}` {
  const cleanAddress = suiAddress.replace('0x', '');
  const paddedAddress = cleanAddress.padStart(64, '0');
  return `0x${paddedAddress}`;
}

export async function estimateBridgeFee(amount: string): Promise<{
  gasEstimate: string;
  bridgeFee: string;
  total: string;
}> {
  return {
    gasEstimate: '0.001',
    bridgeFee: '0.00',
    total: '0.001',
  };
}

export default {
  bridgeArcToSui,
  estimateBridgeFee,
};