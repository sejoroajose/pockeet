'use client';

import { useState, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { bridgeToSui } from './bridge';
import { type CCTPChainConfig } from '../arc/chains';

export function useCCTPBridge(sourceChain: CCTPChainConfig) {
  const { data: walletClient } = useWalletClient({ chainId: sourceChain.chain.id });
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
      const suiRecipient = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID || 
        '0x0000000000000000000000000000000000000000000000000000000000000000';

      setProgress(10);
      console.log(`Bridging from ${sourceChain.chain.name} to Sui...`);

      const result = await bridgeToSui(walletClient, sourceChain, amount, suiRecipient);
      
      setProgress(50);
      setTxHash(result.burnTxHash);
      
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
  }, [walletClient, sourceChain]);

  const reset = useCallback(() => {
    setExecuting(false);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setTxHash(null);
  }, []);

  return { execute, executing, progress, error, success, txHash, reset };
}