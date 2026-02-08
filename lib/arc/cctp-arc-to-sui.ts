import { type Address, type Hash, parseUnits, erc20Abi } from 'viem';
import { arcPublicClient, getUSDCAddress } from './client';
import type { WalletClient } from 'viem';
import { arcTestnet } from './client';

const TOKEN_MESSENGER = (process.env.NEXT_PUBLIC_ARC_TOKEN_MESSENGER || 
  '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5') as Address;

const SUI_DOMAIN = 8; 

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
  message?: string;       
  messageHash?: string;    
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
  
  const receipt = await arcPublicClient.waitForTransactionReceipt({ hash: burnTxHash });
  console.log('Burn confirmed:', burnTxHash);
  
  let message: string | undefined;
  let messageHash: string | undefined;
  
  try {
    // Find MessageSent event
    const messageSentLog = receipt.logs.find(log => 
      log.topics[0] === '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036' // MessageSent topic
    );
    
    if (messageSentLog && messageSentLog.data) {
      message = messageSentLog.data;
      // Calculate message hash for attestation
      const { keccak256 } = await import('viem');
      messageHash = keccak256(message as `0x${string}`);
      console.log('Message hash:', messageHash);
    }
  } catch (error) {
    console.error('Failed to extract message:', error);
  }
  
  return {
    burnTxHash: burnTxHash,
    amount,
    recipient: suiRecipient,
    message,
    messageHash,
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

// ✅ NEW: Get Circle attestation
export async function getAttestation(messageHash: string): Promise<string | null> {
  const maxAttempts = 40;
  const delayMs = 5000;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'complete') {
          return data.attestation;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error('Attestation poll error:', error);
    }
  }
  
  return null;
}

export default {
  bridgeArcToSui,
  estimateBridgeFee,
  getAttestation,
};