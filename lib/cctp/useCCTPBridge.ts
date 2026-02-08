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
  const [message, setMessage] = useState<string | null>(null);          
  const [messageHash, setMessageHash] = useState<string | null>(null);  

  const execute = useCallback(async (amount: string, suiUserAddress: string) => { 
    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    if (!walletClient) {
      setError('Wallet not connected');
      return;
    }
    
    if (!suiUserAddress) {
      setError('Sui address not configured');
      return;
    }

    setExecuting(true);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setTxHash(null);
    setMessage(null);
    setMessageHash(null);

    try {
      setProgress(10);

      const result = await bridgeToSui(walletClient, sourceChain, amount, suiUserAddress);
      
      setProgress(50);
      setTxHash(result.burnTxHash);
      setMessage(result.message || null);
      setMessageHash(result.messageHash || null);
      
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgress(100);
      setSuccess(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bridge failed';
      setError(errorMsg);
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
    setMessage(null);
    setMessageHash(null);
  }, []);

  return { execute, executing, progress, error, success, txHash, message, messageHash, reset };
}