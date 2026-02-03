import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, executeTransaction } from '../sui/client';
import type { SuiNetwork } from '../sui/types';
import type { Address } from 'viem';

// CCTP contract addresses on Sui (these are examples - replace with actual)
const SUI_TOKEN_MESSENGER_MINTER = process.env.NEXT_PUBLIC_SUI_TOKEN_MESSENGER_MINTER!;
const SUI_MESSAGE_TRANSMITTER = process.env.NEXT_PUBLIC_SUI_MESSAGE_TRANSMITTER!;

// Arc domain (Circle's domain identifier for Arc)
const ARC_DOMAIN = 5042002; // Update with actual Arc domain from Circle

export interface SuiBridgeResult {
  txDigest: string;
  amount: string;
  recipient: string;
}

/**
 * Bridge USDC from Sui to Arc using Circle's CCTP
 */
export async function bridgeSuiToArc(
  amount: string,
  arcRecipient: Address,
  network: SuiNetwork = 'testnet'
): Promise<SuiBridgeResult> {
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  
  // Convert Arc address to bytes32
  const recipientBytes32 = arcAddressToBytes(arcRecipient);
  
  const tx = new Transaction();
  
  // 1. Split USDC coin for burning
  const [coinToBurn] = tx.splitCoins(tx.gas, [amount]);
  
  // 2. Call burn_and_send on Sui CCTP contract
  tx.moveCall({
    target: `${SUI_TOKEN_MESSENGER_MINTER}::token_messenger_minter::burn_and_send`,
    arguments: [
      tx.object(SUI_TOKEN_MESSENGER_MINTER),
      coinToBurn,
      tx.pure.u32(ARC_DOMAIN),
      tx.pure.vector('u8', recipientBytes32),
    ],
    typeArguments: [`${packageId}::usdc::USDC`],
  });
  
  // Execute transaction
  const txDigest = await executeTransaction(tx, network);
  
  console.log('USDC burned on Sui:', txDigest);
  
  return {
    txDigest,
    amount,
    recipient: arcRecipient,
  };
}

/**
 * Get attestation for Sui burn transaction
 */
export async function getSuiAttestation(
  txDigest: string,
  network: SuiNetwork = 'testnet'
): Promise<string | null> {
  const client = getSuiClient(network);
  
  try {
    // Get transaction details
    const txResponse = await client.getTransactionBlock({
      digest: txDigest,
      options: {
        showEvents: true,
        showEffects: true,
      },
    });
    
    if (!txResponse.events) {
      throw new Error('No events found in transaction');
    }
    
    // Find MessageSent event
    const messageSentEvent = txResponse.events.find(
      event => event.type.includes('MessageSent')
    );
    
    if (!messageSentEvent) {
      throw new Error('MessageSent event not found');
    }
    
    // Extract message hash from event
    const eventData = messageSentEvent.parsedJson as any;
    const messageHash = eventData.message_hash;
    
    // Poll Circle's Attestation API
    const attestation = await pollForAttestation(messageHash);
    
    return attestation;
  } catch (error) {
    console.error('Failed to get Sui attestation:', error);
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
  const baseUrl = 'https://iris-api-sandbox.circle.com'; // Use production for mainnet
  
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
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error('Attestation poll error:', error);
    }
  }
  
  return null;
}

/**
 * Convert Arc address to bytes for Sui
 */
function arcAddressToBytes(arcAddress: Address): number[] {
  // Remove '0x' prefix
  const cleanAddress = arcAddress.slice(2);
  
  // Convert hex string to bytes
  const bytes: number[] = [];
  for (let i = 0; i < cleanAddress.length; i += 2) {
    bytes.push(parseInt(cleanAddress.substr(i, 2), 16));
  }
  
  return bytes;
}

/**
 * Estimate bridge fee
 */
export async function estimateSuiBridgeFee(amount: string): Promise<{
  gasEstimate: string;
  bridgeFee: string;
  total: string;
}> {
  // CCTP has no protocol fee
  const gasEstimate = '0.001'; // Estimated in SUI
  const bridgeFee = '0.00';
  
  return {
    gasEstimate,
    bridgeFee,
    total: gasEstimate,
  };
}

/**
 * Check bridge status
 */
export async function checkSuiBridgeStatus(
  txDigest: string,
  network: SuiNetwork = 'testnet'
): Promise<{
  status: 'pending' | 'attested' | 'complete' | 'failed';
  attestation?: string;
}> {
  try {
    const attestation = await getSuiAttestation(txDigest, network);
    
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
  bridgeSuiToArc,
  getSuiAttestation,
  estimateSuiBridgeFee,
  checkSuiBridgeStatus,
};