'use client';

import { useState } from 'react';
import { useConnection } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowDownToLine, CheckCircle2 } from 'lucide-react';
import { ChainSelector } from '@/components/cctp/chain-selector';
import { CCTP_CHAINS, type CCTPChainConfig } from '@/lib/arc/chains';

export function WithdrawForm({ vaultId }: { vaultId: string }) {
  const [amount, setAmount] = useState('');
  const [bridgeBack, setBridgeBack] = useState(false);
  const [targetChain, setTargetChain] = useState<CCTPChainConfig>(CCTP_CHAINS.sepolia);
  const { address: evmAddress } = useConnection();
  
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [bridgeTxHash, setBridgeTxHash] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0 || !evmAddress) return;
    
    setWithdrawing(true);
    setError(null);
    setTxDigest(null);
    setBridgeTxHash(null);

    try {
      const amountInMist = (parseFloat(amount) * 1_000_000_000).toString();
      
      // Call relayer withdrawal API
      const response = await fetch('/api/withdraw-and-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: evmAddress,           
          amount: amountInMist,
          recipientAddress: evmAddress,       
          destinationChainId: bridgeBack ? targetChain.chain.id : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTxDigest(result.withdrawTxHash || result.txDigest);
        
        if (bridgeBack && result.bridgeTxHash) {
          setBridgeTxHash(result.bridgeTxHash);
        }
        
        setAmount('');
      } else {
        setError(result.error || 'Withdrawal failed');
      }
    } catch (err) {
      console.error('Withdraw failed:', err);
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const reset = () => {
    setTxDigest(null);
    setBridgeTxHash(null);
    setError(null);
    setAmount('');
  };

  if (txDigest) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="font-bold text-green-900 mb-2">
                {bridgeBack ? 'Withdrawal & Bridge In Progress!' : 'Withdrawal Successful!'}
              </h3>
              
              {/* Sui Withdrawal */}
              <div className="mb-3">
                <p className="text-sm text-green-700 mb-1">
                  {bridgeBack ? 'Step 1: Withdrawn from Sui Vault' : 'Withdrawn from Sui Vault:'}
                </p>
                <a 
                  href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline font-mono"
                >
                  {txDigest.slice(0, 10)}...{txDigest.slice(-8)}
                </a>
              </div>

              {/* Bridge Transaction */}
              {bridgeBack && bridgeTxHash && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 mb-1">Step 2: Bridging to {targetChain.chain.name}</p>
                  <a 
                    href={`https://suiscan.xyz/testnet/tx/${bridgeTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline font-mono"
                  >
                    {bridgeTxHash.slice(0, 10)}...{bridgeTxHash.slice(-8)}
                  </a>
                  <p className="text-xs text-blue-600 mt-2">
                    ⏳ USDC will arrive in ~3 minutes
                  </p>
                </div>
              )}

              {bridgeBack && !bridgeTxHash && (
                <div className="flex items-center justify-center space-x-2 text-blue-600 p-3 bg-blue-50 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Bridging to {targetChain.chain.name}...</span>
                </div>
              )}
            </div>
            <Button onClick={reset} variant="outline" className="w-full">
              Make Another Withdrawal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowDownToLine className="h-5 w-5" />
          <span>Withdraw from Vault</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-gray-600 mb-2 block">
            Amount (SUI)
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={withdrawing || !evmAddress}
            step="0.01"
            min="0"
          />
          {!evmAddress && (
            <p className="text-xs text-red-600 mt-1">
              Please connect your Ethereum wallet
            </p>
          )}
        </div>

        {/* Bridge Back Option */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bridgeBack}
              onChange={(e) => setBridgeBack(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
              disabled={!evmAddress}
            />
            <span className="text-sm font-medium text-gray-700">
              Bridge back to EVM chain
            </span>
          </label>

          {bridgeBack && (
            <div className="space-y-2">
              <label className="text-xs text-gray-600 mb-1 block">
                Destination Chain
              </label>
              <ChainSelector
                selectedChain={targetChain}
                onChainSelect={setTargetChain}
              />
              <p className="text-xs text-gray-500 mt-2">
                💰 USDC will be sent to: {evmAddress ? `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}` : 'Connect wallet'}
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button
          onClick={handleWithdraw}
          disabled={!amount || parseFloat(amount) <= 0 || withdrawing || !evmAddress}
          className="w-full"
          size="lg"
        >
          {withdrawing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : bridgeBack ? (
            `Withdraw & Bridge ${amount || '0'} SUI to ${targetChain.chain.name}`
          ) : (
            `Withdraw ${amount || '0'} SUI`
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          {bridgeBack 
            ? '🌉 Withdrawal + Bridge takes ~3 minutes via Circle CCTP' 
            : '⚡ Withdrawal is instant and gas-free'}
        </p>
      </CardContent>
    </Card>
  );
}