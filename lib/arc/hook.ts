'use client';

import { useState, useCallback } from 'react';
import { bridgeArcToSui, estimateBridgeFee } from './cctp-arc-to-sui';

export function useCCTPBridge() {
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

    setExecuting(true);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      // Hardcoded Sui recipient for demo
      const suiRecipient = process.env.NEXT_PUBLIC_SUI_VAULT_ADDRESS || '0x...';

      setProgress(25);
      
      const result = await bridgeArcToSui(amount, suiRecipient);
      
      setProgress(50);
      setTxHash(result.burnTxHash);
      
      // Simulate waiting for attestation
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgress(100);
      setSuccess(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bridge failed';
      setError(errorMsg);
      console.error('CCTP bridge error:', err);
    } finally {
      setExecuting(false);
    }
  }, []);

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