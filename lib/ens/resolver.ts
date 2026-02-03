'use client';

import { createPublicClient, http } from 'viem';
import { normalize } from 'viem/ens';
import { mainnet, sepolia } from 'viem/chains';
import type { Address } from 'viem';

// Select network based on environment
const chain = process.env.NEXT_PUBLIC_ENS_NETWORK === 'mainnet' ? mainnet : sepolia;

// Create public client
export const ensPublicClient = createPublicClient({
  chain,
  transport: http(),
});

/**
 * Resolve ENS name to address
 */
export async function resolveENS(name: string): Promise<Address | null> {
  try {
    const address = await ensPublicClient.getEnsAddress({
      name: normalize(name),
    });
    
    return address;
  } catch (error) {
    console.error('ENS resolution failed:', error);
    return null;
  }
}

/**
 * Reverse resolve address to ENS name
 */
export async function reverseResolveENS(address: Address): Promise<string | null> {
  try {
    const name = await ensPublicClient.getEnsName({
      address,
    });
    
    return name;
  } catch (error) {
    console.error('ENS reverse resolution failed:', error);
    return null;
  }
}

/**
 * Get ENS avatar
 */
export async function getENSAvatar(name: string): Promise<string | null> {
  try {
    const avatar = await ensPublicClient.getEnsAvatar({
      name: normalize(name),
    });
    
    return avatar;
  } catch (error) {
    console.error('ENS avatar fetch failed:', error);
    return null;
  }
}

/**
 * Get ENS text record
 */
export async function getTextRecord(name: string, key: string): Promise<string | null> {
  try {
    const text = await ensPublicClient.getEnsText({
      name: normalize(name),
      key,
    });
    
    return text;
  } catch (error) {
    console.error('ENS text record fetch failed:', error);
    return null;
  }
}

/**
 * Get multiple ENS text records
 */
export async function getTextRecords(
  name: string,
  keys: string[]
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  
  await Promise.all(
    keys.map(async (key) => {
      results[key] = await getTextRecord(name, key);
    })
  );
  
  return results;
}

/**
 * Check if ENS name exists
 */
export async function ensExists(name: string): Promise<boolean> {
  try {
    const address = await resolveENS(name);
    return address !== null;
  } catch {
    return false;
  }
}

/**
 * Validate ENS name format
 */
export function validateENSName(name: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Check basic format
    if (!name || !name.includes('.')) {
      return {
        valid: false,
        error: 'Invalid ENS name format',
      };
    }
    
    // Try normalizing
    normalize(name);
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid ENS name',
    };
  }
}

/**
 * Get ENS resolver
 */
export async function getResolver(name: string): Promise<Address | null> {
  try {
    const resolver = await ensPublicClient.getEnsResolver({
      name: normalize(name),
    });
    
    return resolver;
  } catch (error) {
    console.error('Failed to get ENS resolver:', error);
    return null;
  }
}

export default {
  resolveENS,
  reverseResolveENS,
  getENSAvatar,
  getTextRecord,
  getTextRecords,
  ensExists,
  validateENSName,
  getResolver,
};