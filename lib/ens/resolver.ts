'use client';

import { createPublicClient, http, fallback } from 'viem';
import { normalize } from 'viem/ens';
import { mainnet, sepolia } from 'viem/chains';
import type { Address } from 'viem';

// Select network based on environment
const chain = process.env.NEXT_PUBLIC_ENS_NETWORK === 'sepolia' ? mainnet : sepolia;

const getTransport = () => {
  if (chain.id === 1) {
    return fallback([
      http('https://eth.llamarpc.com'),
      http('https://ethereum.publicnode.com'),
      http('https://rpc.ankr.com/eth'),
    ]);
  } else {
    return fallback([
      http('https://ethereum-sepolia-rpc.publicnode.com'),
      http('https://rpc.sepolia.org'),
      http('https://rpc2.sepolia.org'),
      http('https://sepolia.gateway.tenderly.co'),
    ], {
      retryCount: 2,
      retryDelay: 500,
    });
  }
};

// Create public client with fallback and retry logic
export const ensPublicClient = createPublicClient({
  chain,
  transport: getTransport(),
  batch: {
    multicall: true,
  },
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
 * Reverse resolve address to ENS name with timeout
 */
export async function reverseResolveENS(address: Address): Promise<string | null> {
  try {
    // Add a timeout wrapper
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 8000)
    );
    
    const resolvePromise = ensPublicClient.getEnsName({
      address,
    });
    
    const name = await Promise.race([resolvePromise, timeoutPromise]);
    
    return name;
  } catch (error) {
    // Don't log timeout errors in production
    if (error instanceof Error && error.message !== 'Timeout') {
      console.error('ENS reverse resolution failed:', error);
    }
    return null;
  }
}

/**
 * Get ENS avatar with timeout
 */
export async function getENSAvatar(name: string): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const avatarPromise = ensPublicClient.getEnsAvatar({
      name: normalize(name),
    });
    
    const avatar = await Promise.race([avatarPromise, timeoutPromise]);
    
    return avatar;
  } catch (error) {
    if (error instanceof Error && error.message !== 'Timeout') {
      console.error('ENS avatar fetch failed:', error);
    }
    return null;
  }
}

/**
 * Get ENS text record with timeout
 */
export async function getTextRecord(name: string, key: string): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const textPromise = ensPublicClient.getEnsText({
      name: normalize(name),
      key,
    });
    
    const text = await Promise.race([textPromise, timeoutPromise]);
    
    return text;
  } catch (error) {
    if (error instanceof Error && error.message !== 'Timeout') {
      console.error('ENS text record fetch failed:', error);
    }
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