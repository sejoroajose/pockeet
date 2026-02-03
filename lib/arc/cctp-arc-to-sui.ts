import { type Address, type Hash, parseUnits } from 'viem';
import { arcPublicClient, createArcWalletClient, getUSDCAddress } from './client';

// CCTP Contract addresses on Arc
const TOKEN_MESSENGER = (process.env.NEXT_PUBLIC_ARC_TOKEN_MESSENGER || 
  '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5') as Address;

const MESSAGE_TRANSMITTER = (process.env.NEXT_PUBLIC_ARC_MESSAGE_TRANSMITTER ||
  '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD') as Address;

const SUI_DOMAIN = 8; 

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
  amount: string,
  suiRecipient: string
): Promise<BridgeResult> {
  const walletClient = createArcWalletClient();
  const usdcAddress = getUSDCAddress();
  const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
  
  // Convert Sui address to bytes32 format
  const recipientBytes32 = suiAddressToBytes32(suiRecipient);
  
  // 1. Approve TokenMessenger to spend USDC
  console.log('Approving USDC spending...');
  const approveTx = await walletClient.writeContract({
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
    args: [TOKEN_MESSENGER, amountWei],
  });
  
  await arcPublicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log('Approval confirmed:', approveTx);
  
  // 2. Call depositForBurn on TokenMessenger
  console.log('Burning USDC on Arc...');
  const burnTx = await walletClient.writeContract({
    address: TOKEN_MESSENGER,
    abi: [
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
    ],
    functionName: 'depositForBurn',
    args: [amountWei, SUI_DOMAIN, recipientBytes32, usdcAddress],
  });
  
  await arcPublicClient.waitForTransactionReceipt({ hash: burnTx });
  console.log('Burn confirmed:', burnTx);
  
  return {
    burnTxHash: burnTx,
    amount,
    recipient: suiRecipient,
  };
}

/**
 * Get attestation for a burn transaction
 * This would typically be called by a backend service or after some delay
 */
export async function getAttestation(
  burnTxHash: Hash
): Promise<string | null> {
  try {
    // Get the transaction receipt
    const receipt = await arcPublicClient.getTransactionReceipt({
      hash: burnTxHash,
    });
    
    // Extract MessageSent event
    const messageSentEvent = receipt.logs.find(
      log => log.address.toLowerCase() === MESSAGE_TRANSMITTER.toLowerCase()
    );
    
    if (!messageSentEvent) {
      throw new Error('MessageSent event not found');
    }
    
    // In production, you would call Circle's Attestation API
    // https://iris-api.circle.com/attestations/{messageHash}
    const messageHash = messageSentEvent.topics[1];
    
    if (!messageHash) {
      throw new Error('Message hash not found in event topics');
    }
    
    // Poll Circle's API for attestation
    const attestation = await pollForAttestation(messageHash);
    
    return attestation;
  } catch (error) {
    console.error('Failed to get attestation:', error);
    return null;
  }
}

/**
 * Poll Circle's Attestation API
 */
async function pollForAttestation(
  messageHash: string,
  maxAttempts: number = 20,
  delayMs: number = 3000
): Promise<string | null> {
  const baseUrl = 'https://iris-api-sandbox.circle.com'; // Use production URL for mainnet
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${baseUrl}/attestations/${messageHash}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'complete') {
          return data.attestation;
        }
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error('Attestation poll error:', error);
    }
  }
  
  return null;
}

/**
 * Convert Sui address to bytes32 format for CCTP
 */
function suiAddressToBytes32(suiAddress: string): `0x${string}` {
  // Remove '0x' prefix if present
  const cleanAddress = suiAddress.replace('0x', '');
  
  // Sui addresses are 32 bytes, pad if needed
  const paddedAddress = cleanAddress.padStart(64, '0');
  
  return `0x${paddedAddress}`;
}

/**
 * Get bridge fee estimate
 */
export async function estimateBridgeFee(amount: string): Promise<{
  gasEstimate: string;
  bridgeFee: string;
  total: string;
}> {
  // CCTP has no protocol fee, only gas
  const gasEstimate = '0.001'; // Estimated in ETH
  const bridgeFee = '0.00'; // CCTP is feeless
  
  return {
    gasEstimate,
    bridgeFee,
    total: gasEstimate,
  };
}

/**
 * Check if bridge transaction is complete
 */
export async function checkBridgeStatus(burnTxHash: Hash): Promise<{
  status: 'pending' | 'attested' | 'complete' | 'failed';
  attestation?: string;
}> {
  try {
    const attestation = await getAttestation(burnTxHash);
    
    if (attestation) {
      return {
        status: 'attested',
        attestation,
      };
    }
    
    return { status: 'pending' };
  } catch (error) {
    return { status: 'failed' };
  }
}

export default {
  bridgeArcToSui,
  getAttestation,
  estimateBridgeFee,
  checkBridgeStatus,
};