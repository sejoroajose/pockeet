'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from 'wagmi';
import { 
  resolveENS, 
  reverseResolveENS, 
  getENSAvatar,
  validateENSName,
} from './resolver';
import { getTreasurySettings, hasTreasury } from './records';
import type { TreasurySettings } from './records';
import type { Address } from 'viem';

/**
 * Hook to resolve ENS name or reverse resolve address
 */
export function useENS(addressOrName?: string) {
  const { address: connectedAddress } = useConnection();
  const input = addressOrName || connectedAddress;
  
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensAddress, setEnsAddress] = useState<Address | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input) {
      setEnsName(null);
      setEnsAddress(null);
      setAvatar(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    async function resolve() {
      try {
        // Check if input is ENS name or address
        if (input!.includes('.')) {
          // It's an ENS name
          const validation = validateENSName(input!);
          if (!validation.valid) {
            setError(validation.error || 'Invalid ENS name');
            return;
          }
          
          const [address, avatarUrl] = await Promise.all([
            resolveENS(input!),
            getENSAvatar(input!),
          ]);
          
          setEnsName(input!);
          setEnsAddress(address);
          setAvatar(avatarUrl);
        } else {
          // It's an address
          const name = await reverseResolveENS(input as Address);
          const avatarUrl = name ? await getENSAvatar(name) : null;
          
          setEnsName(name);
          setEnsAddress(input as Address);
          setAvatar(avatarUrl);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Resolution failed';
        console.error('ENS resolution error:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    resolve();
  }, [input]);

  return { 
    ensName, 
    ensAddress, 
    avatar, 
    loading, 
    error 
  };
}

/**
 * Hook to get treasury settings from ENS
 */
export function useTreasurySettings(ensName?: string) {
  const { ensName: resolvedName } = useENS();
  const name = ensName || resolvedName;
  
  const [settings, setSettings] = useState<TreasurySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTreasuryConfig, setHasTreasuryConfig] = useState(false);

  useEffect(() => {
    if (!name) {
      setSettings(null);
      setHasTreasuryConfig(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    async function fetchSettings() {
      try {
        const [treasuryExists, treasurySettings] = await Promise.all([
          hasTreasury(name!),
          getTreasurySettings(name!),
        ]);
        
        setHasTreasuryConfig(treasuryExists);
        setSettings(treasurySettings);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
        console.error('Treasury settings error:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, [name]);

  return { 
    settings, 
    loading, 
    error,
    hasTreasury: hasTreasuryConfig,
  };
}

/**
 * Hook to display ENS name or shortened address
 */
export function useDisplayName(address?: Address) {
  const { ensName, loading } = useENS(address);
  
  const displayName = ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');
  
  return { displayName, isENS: !!ensName, loading };
}

/**
 * Hook to check if address has ENS
 */
export function useHasENS(address?: Address) {
  const { ensName, loading } = useENS(address);
  
  return { hasENS: !!ensName, ensName, loading };
}

/**
 * Hook with manual ENS lookup
 */
export function useENSLookup() {
  const [result, setResult] = useState<{
    name?: string;
    address?: Address;
    avatar?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (input: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (input.includes('.')) {
        // Lookup name -> address
        const validation = validateENSName(input);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid ENS name');
        }
        
        const [address, avatar] = await Promise.all([
          resolveENS(input),
          getENSAvatar(input),
        ]);
        
        if (!address) {
          throw new Error('ENS name not found');
        }
        
        setResult({ name: input, address, avatar: avatar ?? undefined });
      } else {
        // Lookup address -> name
        const name = await reverseResolveENS(input as Address);
        const avatar = name ? await getENSAvatar(name) : null;
        
        setResult({ 
          name: name ?? undefined, 
          address: input as Address, 
          avatar: avatar ?? undefined 
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lookup failed';
      console.error('ENS lookup error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, lookup, reset };
}