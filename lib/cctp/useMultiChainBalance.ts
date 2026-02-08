'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPublicClient, http, type Address, erc20Abi, fallback } from 'viem';
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

  const fetchBalances = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    const results: ChainBalance[] = [];
    let total = 0;

    // Fetch balances in parallel with better error handling
    const balancePromises = Object.values(CCTP_CHAINS).map(async (config) => {
      try {
        const client = createPublicClient({
          chain: config.chain,
          transport: fallback([
            http(config.rpcUrl),
            http(), // Fallback to default
          ], {
            rank: true,
            retryCount: 3,
            retryDelay: 1000,
          }),
        });

        const balance = await client.readContract({
          address: config.usdcAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });

        const formatted = (Number(balance) / 1e6).toFixed(2);
        total += Number(formatted);

        return {
          chainId: config.chain.id,
          chainName: config.chain.name,
          balance,
          formattedBalance: formatted,
        };
      } catch (error) {
        console.error(`Failed to fetch balance for ${config.chain.name}:`, error);
        return {
          chainId: config.chain.id,
          chainName: config.chain.name,
          balance: 0n,
          formattedBalance: '0.00',
          error: 'Failed to fetch',
        };
      }
    });

    const fetchedBalances = await Promise.all(balancePromises);
    
    setBalances(fetchedBalances);
    setTotalBalance(total.toFixed(2));
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, totalBalance, loading, refetch: fetchBalances };
}