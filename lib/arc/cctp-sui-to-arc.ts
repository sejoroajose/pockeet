import { Transaction } from '@mysten/sui/transactions';
import { getSuiClient, executeTransaction } from '../sui/client';
import type { SuiNetwork } from '../sui/types';
import type { Address } from 'viem';

const SUI_TOKEN_MESSENGER_MINTER = process.env.NEXT_PUBLIC_SUI_TOKEN_MESSENGER_MINTER!;
const SUI_MESSAGE_TRANSMITTER = process.env.NEXT_PUBLIC_SUI_MESSAGE_TRANSMITTER!;


const ARC_DOMAIN = 5042002; 

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
    const result = await client.core.getTransaction({
      digest: txDigest,
      include: {
        effects: true,
        events: true,
        transaction: true,
      },
    });
    
    if (!result.Transaction) {
      throw new Error('Transaction not found');
    }
    
    if (!result.Transaction.events || result.Transaction.events.length === 0) {
      throw new Error('No events found in transaction');
    }
    
    const messageSentEvent = result.Transaction.events.find(
      (event: any) => {
        // Check if event has the MessageSent type
        return event.eventType?.includes('MessageSent') || 
               event.$kind === 'MessageSent' ||
               (event.type && event.type.includes('MessageSent'));
      }
    );
    
    if (!messageSentEvent) {
      throw new Error('MessageSent event not found');
    }
    
    // Extract message hash from event
    // The event data structure varies, so we need to handle different cases
    let messageHash: string;
    
    if ((messageSentEvent as any).data) {
      // If event has a 'data' field
      const eventData = (messageSentEvent as any).data;
      messageHash = eventData.message_hash || eventData.messageHash;
    } else if ((messageSentEvent as any).parsedJson) {
      // If event has parsedJson
      const eventData = (messageSentEvent as any).parsedJson;
      messageHash = eventData.message_hash || eventData.messageHash;
    } else {
      // Direct access
      messageHash = (messageSentEvent as any).message_hash || (messageSentEvent as any).messageHash;
    }
    
    if (!messageHash) {
      throw new Error('Message hash not found in event');
    }
    
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
  const baseUrl = 'https://iris-api-sandbox.circle.com'; 

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
    bytes.push(parseInt(cleanAddress.substring(i, i + 2), 16));
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