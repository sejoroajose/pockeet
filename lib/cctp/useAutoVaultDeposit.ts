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
        console.log('Waiting for CCTP attestation...');
        
        // Wait 3 minutes for CCTP to complete
        await new Promise(resolve => setTimeout(resolve, 180000));
        
        setStatus('depositing');
        console.log('Depositing to vault...');
        
        // Call auto-deposit API
        const response = await fetch('/api/auto-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userAddress, 
            amount: parseFloat(amount) * 1_000_000 // Convert to wei
          }),
        });

        const result = await response.json();

        if (result.success) {
          setVaultTxHash(result.txDigest);
          setStatus('complete');
          console.log('Auto-deposit complete:', result.txDigest);
        } else {
          setError(result.error || 'Auto-deposit failed');
          setStatus('failed');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Auto-deposit error:', errorMsg);
        setError(errorMsg);
        setStatus('failed');
      }
    };

    autoDeposit();
  }, [bridgeTxHash, userAddress, amount]);

  return { status, vaultTxHash, error };
}