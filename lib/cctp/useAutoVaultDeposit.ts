'use client';

import { useState, useEffect } from 'react';
import type { Address } from 'viem';

export function useAutoVaultDeposit(
  bridgeTxHash: string | null,
  userAddress: Address | undefined,
  amount: string
) {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'depositing' | 'complete' | 'failed'>('idle');
  const [vaultTxHash, setVaultTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bridgeTxHash || !userAddress || !amount) return;

    const autoDeposit = async () => {
      try {
        setStatus('waiting');
        
        const maxPolls = 40;
        const pollInterval = 10000;
        let usdcArrived = false;
        
        for (let i = 0; i < maxPolls; i++) {
          const checkResponse = await fetch('/api/check-sui-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress }),
          });
          
          if (!checkResponse.ok) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
          }
          
          const checkResult = await checkResponse.json();
          
          if (checkResult.hasUSDC && checkResult.balance > 0) {
            usdcArrived = true;
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        if (!usdcArrived) {
          setError('CCTP transfer timed out. Please check your Sui address and deposit manually.');
          setStatus('failed');
          return;
        }
        
        setStatus('depositing');
        
        const response = await fetch('/api/auto-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userAddress, 
            amount: parseFloat(amount) * 1_000_000
          }),
        });

        const result = await response.json();

        if (result.success) {
          setVaultTxHash(result.txDigest);
          setStatus('complete');
        } else {
          setError(result.error || 'Auto-deposit failed');
          setStatus('failed');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setStatus('failed');
      }
    };

    autoDeposit();
  }, [bridgeTxHash, userAddress, amount]);

  return { status, vaultTxHash, error };
}