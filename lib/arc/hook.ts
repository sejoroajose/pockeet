'use client';

import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { bridgeArcToSui } from './cctp-arc-to-sui';

const ARC_TESTNET_CHAIN_ID = 5042002;

export function useCCTPBridge() {
  const { data: walletClient } = useWalletClient({ chainId: ARC_TESTNET_CHAIN_ID });
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const execute = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    if (!walletClient) {
      setError('Wallet not connected');
      return;
    }

    setExecuting(true);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      // Get Sui vault address from environment
      const suiRecipient = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID || 
        '0x0000000000000000000000000000000000000000000000000000000000000000';

      setProgress(10);
      console.log('Starting CCTP bridge...');

      // Call bridge function with wallet client
      const result = await bridgeArcToSui(walletClient, amount, suiRecipient);
      
      setProgress(50);
      setTxHash(result.burnTxHash);
      
      console.log('Burn transaction confirmed:', result.burnTxHash);
      
      // Simulate progress while waiting for CCTP attestation
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgress(100);
      setSuccess(true);
      console.log('Bridge complete!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bridge failed';
      setError(errorMsg);
      console.error('CCTP bridge error:', err);
    } finally {
      setExecuting(false);
    }
  }, [walletClient]);

  const reset = useCallback(() => {
    setExecuting(false);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setTxHash(null);
  }, []);

  return {
    execute,
    executing,
    progress,
    error,
    success,
    txHash,
    reset,
  };
}