'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPublicClient, http, type Address, erc20Abi } from 'viem';
import { CCTP_CHAINS, type CCTPChainConfig } from '../arc/chains';

export interface ChainBalance {
  chainId: number;
  chainName: string;
  balance: bigint;
  formattedBalance: string;
  error?: string;
}

export function useMultiChainBalance(address: Address | undefined) {
  const [balances, setBalances] = useState<ChainBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalBalance, setTotalBalance] = useState('0');
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!address) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    const results: ChainBalance[] = [];
    let total = 0;

    // Fetch with timeout and reduced concurrent requests
    const balancePromises = Object.values(CCTP_CHAINS).map(async (config) => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000) // 5s timeout
      );

      try {
        const client = createPublicClient({
          chain: config.chain,
          transport: http(config.rpcUrl, {
            timeout: 5000,
            retryCount: 1, // Reduce retries
          }),
        });

        const balancePromise = client.readContract({
          address: config.usdcAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });

        const balance = await Promise.race([balancePromise, timeoutPromise]) as bigint;

        const formatted = (Number(balance) / 1e6).toFixed(2);
        
        // Only include chains with non-zero balance
        if (Number(formatted) > 0) {
          total += Number(formatted);
          return {
            chainId: config.chain.id,
            chainName: config.chain.name,
            balance,
            formattedBalance: formatted,
          };
        }
        return null;
      } catch (error) {
        console.warn(`Skipped ${config.chain.name} (timeout or error)`);
        return null;
      }
    });

    const fetchedBalances = (await Promise.all(balancePromises)).filter(Boolean) as ChainBalance[];
    
    setBalances(fetchedBalances);
    setTotalBalance(total.toFixed(2));
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchBalances();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [address]);

  return { balances, totalBalance, loading, refetch: fetchBalances };
}