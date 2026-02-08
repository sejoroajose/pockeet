'use client';

import { useState, useEffect } from 'react';
import type { Address } from 'viem';

export function useAutoVaultDeposit(
  bridgeTxHash: string | null,
  userAddress: Address | undefined,
  amount: string,
  message?: string,         
  messageHash?: string      
) {
  const [status, setStatus] = useState<'idle' | 'attestation' | 'minting' | 'depositing' | 'complete' | 'failed'>('idle');
  const [vaultTxHash, setVaultTxHash] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);  
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);  

  useEffect(() => {
     if (!bridgeTxHash || !userAddress || !amount || !message || !messageHash) return;
 
     const autoDeposit = async () => {
       try {
         // Step 1: Poll for Circle attestation in the frontend
         setStatus('attestation');
         setProgress(10);
         console.log('Polling for Circle attestation...');
 
         const maxAttestationPolls = 60; 
         const attestationPollInterval = 10000;
         let attestation: string | null = null;
 
         for (let i = 0; i < maxAttestationPolls; i++) {
           try {
             const attResponse = await fetch(
               `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
             );
 
             if (attResponse.ok) {
               const attData = await attResponse.json();
               if (attData.status === 'complete' && attData.attestation) {
                 attestation = attData.attestation;
                 break;
               }
             }
           } catch (err) {
             console.warn('Attestation poll error, retrying...', err);
           }
 
           setProgress(10 + (i / maxAttestationPolls) * 40); // 10% → 50%
           await new Promise(resolve => setTimeout(resolve, attestationPollInterval));
         }
 
         if (!attestation) {
           throw new Error('Attestation timed out. Please try again later.');
         }
 
         console.log('Attestation received, submitting mint on Sui...');
         setProgress(50);
 
         // Step 2: Submit mint transaction with attestation
         const mintResponse = await fetch('/api/complete-cctp-bridge', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ message, attestation, userAddress }),
         });
 
         if (!mintResponse.ok) {
           const result = await mintResponse.json();
           throw new Error(result.error || 'Failed to complete bridge');
         }
 
         const mintResult = await mintResponse.json();
         setMintTxHash(mintResult.mintTxDigest);
         console.log('USDC minted on Sui:', mintResult.mintTxDigest);
 
         // Step 3: Wait for USDC to settle
         setStatus('minting');
         setProgress(60);
         await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 4: Verify USDC arrived
        console.log('Verifying USDC balance...');
        const maxPolls = 10;
        const pollInterval = 3000;
        let usdcArrived = false;
        
        for (let i = 0; i < maxPolls; i++) {
          const checkResponse = await fetch('/api/check-sui-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress }),
          });
          
          if (checkResponse.ok) {
            const checkResult = await checkResponse.json();
            
            if (checkResult.hasUSDC && checkResult.balance > 0) {
              usdcArrived = true;
              break;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        if (!usdcArrived) {
          setError('USDC minted but not showing in balance. Check Sui explorer.');
          setStatus('failed');
          return;
        }
        
        setProgress(75);
        
        // Step 5: Auto-deposit to vault
        setStatus('depositing');
        console.log('Depositing to vault...');
        
        const depositResponse = await fetch('/api/auto-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userAddress, 
            amount: parseFloat(amount) * 1_000_000
          }),
        });

        const depositResult = await depositResponse.json();

        if (depositResult.success) {
          setVaultTxHash(depositResult.txDigest);
          setProgress(100);
          setStatus('complete');
          console.log('Vault deposit complete:', depositResult.txDigest);
        } else {
          setError(depositResult.error || 'Auto-deposit failed');
          setStatus('failed');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setStatus('failed');
        console.error('Auto-deposit error:', err);
      }
    };

    autoDeposit();
  }, [bridgeTxHash, userAddress, amount, message, messageHash]);

  return { status, vaultTxHash, mintTxHash, error, progress };
}