'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from 'wagmi';
import { parseUnits } from 'viem';
import { findRoutes, getBestRoute, getRouteStatus } from './client';
import { executeRoute, getExecutionSummary } from './execute';
import type { Route, RouteExtended } from '@lifi/sdk';
import { useConfig, useSwitchChain } from 'wagmi';

export interface UseLiFiBridgeOptions {
  fromChainId: number;
  toChainId: number;
  tokenAddress: string;
  order?: 'CHEAPEST' | 'FASTEST';
}

/**
 * Main hook for LI.FI bridge functionality
 */
export function useLiFiBridge(options: UseLiFiBridgeOptions) {
  const { address } = useConnection();
  const { fromChainId, toChainId, tokenAddress, order = 'CHEAPEST' } = options;
  
  const [amount, setAmount] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const wagmiConfig = useConfig();
  const { mutateAsync: switchChainWagmi } = useSwitchChain();

  const switchChain = useCallback(
  async ({ chainId }: { chainId: number }) => {
    if (!switchChainWagmi) {
      throw new Error('Chain switching is not supported by your wallet');
    }
    await switchChainWagmi({ chainId });
  },
  [switchChainWagmi]
);

  // Auto-find routes when amount changes
  useEffect(() => {
    if (!amount || !address || parseFloat(amount) <= 0) {
      setRoutes([]);
      setSelectedRoute(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const amountWei = parseUnits(amount, 6).toString(); 
        
        const foundRoutes = await findRoutes(
          fromChainId,
          toChainId,
          tokenAddress,
          tokenAddress, 
          amountWei,
          address,
          address,
          { order }
        );
        
        setRoutes(foundRoutes);
        
        if (foundRoutes.length > 0) {
          setSelectedRoute(foundRoutes[0]); 
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to find routes');
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce
    
    return () => clearTimeout(timer);
  }, [amount, address, fromChainId, toChainId, tokenAddress, order]);

  const execute = useCallback(async () => {
    if (!selectedRoute) {
      throw new Error('No route selected');
    }

    setExecuting(true);
    setProgress(0);
    setError(null);
    setTxHash(null);

    try {
      const finalRoute: RouteExtended = await executeRoute(
        selectedRoute,
        {
          wagmiConfig,
          switchChain, 
          // maxSlippageChange: 5, // optional
        },
        {
          onStepUpdate: (updatedRoute) => {
            const summary = getExecutionSummary(updatedRoute);
            setProgress(summary.progress);
            setCurrentStep(summary.currentStep);

            for (const step of updatedRoute.steps) {
              const hash = step.execution?.process?.find(p => p.txHash)?.txHash;
              if (hash) {
                setTxHash(hash);
                break;
              }
            }
          },
        }
      );

      setProgress(100);
      setCurrentStep(null);
      console.log('Bridge successful:', finalRoute);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bridge execution failed';
      setError(message);
      throw err;
    } finally {
      setExecuting(false);
    }
  }, [selectedRoute, wagmiConfig, switchChain]); 


  // Reset all state
  const reset = useCallback(() => {
    setAmount('');
    setRoutes([]);
    setSelectedRoute(null);
    setError(null);
    setProgress(0);
    setCurrentStep(null);
    setTxHash(null);
  }, []);

  return {
    // Input
    amount,
    setAmount,
    
    // Routes
    routes,
    selectedRoute,
    setSelectedRoute,
    loading,
    
    // Execution
    execute,
    executing,
    progress,
    currentStep,
    
    // Results
    txHash,
    error,
    
    // Actions
    reset,
  };
}

/**
 * Hook to track bridge transaction status
 */
export function useBridgeStatus(txHash: string | null) {
  const [status, setStatus] = useState<{
    status: string;
    substatus?: string;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!txHash) {
      setStatus(null);
      return;
    }

    let mounted = true;

    async function fetchStatus() {
      if (!txHash) return;

      setLoading(true);
      
      try {
        const result = await getRouteStatus(txHash);
        
        if (mounted) {
          setStatus({
            status: result.status,
            substatus: result.substatus,
            message: result.substatusMessage,
          });
        }
      } catch (err: unknown) {
        console.error('Failed to fetch status:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStatus();
    
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [txHash, status?.status]);
  return { status, loading };
}

/**
 * Hook to get best route without storing all routes
 */
export function useBestRoute(
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
  amount: string,
  order: 'CHEAPEST' | 'FASTEST' = 'CHEAPEST'
) {
  const { address } = useConnection();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!amount || !address || parseFloat(amount) <= 0) {
      setRoute(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const amountWei = parseUnits(amount, 6).toString();
        const bestRoute = await getBestRoute(
          fromChainId,
          toChainId,
          tokenAddress,
          amountWei,
          address,
          order
        );
        
        setRoute(bestRoute);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to find route');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, address, fromChainId, toChainId, tokenAddress, order]);

  return { route, loading, error };
}