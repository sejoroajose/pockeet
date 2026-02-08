'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { ArrowLeft, Loader2, Wallet, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatUnits, createPublicClient, http, erc20Abi } from 'viem';
import { useCCTPBridge } from '@/lib/cctp/useCCTPBridge';
import { ChainSelector } from '@/components/cctp/chain-selector';
import { CCTP_CHAINS, type CCTPChainConfig, getCCTPChain } from '@/lib/arc/chains';
import { useMultiChainBalance } from '@/lib/cctp/useMultiChainBalance';
import { fallback } from 'viem';

export default function DepositPage() {
  const { address, isConnected, chainId } = useConnection();
  const router = useRouter();
  
  const [selectedChain, setSelectedChain] = useState<CCTPChainConfig>(CCTP_CHAINS.sepolia);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [balanceLoading, setBalanceLoading] = useState(false);

  const { balances, totalBalance, loading: multiChainLoading, refetch } = useMultiChainBalance(address);
  const { execute, executing, progress, error, success, txHash, reset } = useCCTPBridge(selectedChain);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  useEffect(() => {
    if (chainId) {
      const chain = getCCTPChain(chainId);
      if (chain) {
        setSelectedChain(chain);
      }
    }
  }, [chainId]);

  // Fetch balance for selected chain
  const fetchBalance = async () => {
    if (!address) return;
    
    setBalanceLoading(true);
    try {
      const client = createPublicClient({
        chain: selectedChain.chain,
        transport: fallback([
          http(selectedChain.rpcUrl),
          http(), // Fallback to default
        ], {
          rank: true,
          retryCount: 3,
          retryDelay: 1000,
        }),
      });

      const balanceWei = await client.readContract({
        address: selectedChain.usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      const formatted = formatUnits(balanceWei, 6);
      setBalance(formatted);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0');
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, selectedChain]);

  const balanceNum = parseFloat(balance);
  const amountNum = parseFloat(amount || '0');
  const isWrongChain = chainId !== selectedChain.chain.id;
  const isDepositValid = amount && amountNum > 0 && amountNum <= balanceNum && !executing && !isWrongChain;

  if (!isConnected) return null;

  if (success && txHash) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Successful!</h2>
                <p className="text-gray-600">
                  Your USDC is being bridged from {selectedChain.chain.name} to Sui via Circle CCTP
                </p>
              </div>
              <div className="w-full p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                <p className="text-sm font-mono text-gray-900 break-all">{txHash}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={reset} variant="outline">
                  Make Another Deposit
                </Button>
                <Link href="/vault">
                  <Button>View Vault</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Deposit USDC</h1>
        <p className="text-gray-600 mt-1">
          Deposit from any supported chain → Sui Vault via Circle CCTP
        </p>
      </div>

      {/* Multi-Chain Balance Overview */}
      <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle>Your USDC Across Chains</CardTitle>
        </CardHeader>
        <CardContent>
          {multiChainLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {balances.map((bal) => (
                  <div
                    key={bal.chainId}
                    className="p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="text-xs text-gray-600 mb-1">{bal.chainName}</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {bal.formattedBalance} USDC
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Total Balance:</span>
                <span className="text-xl font-bold text-gray-900">{totalBalance} USDC</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {isWrongChain && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <p className="font-semibold text-orange-900 mb-1">Wrong Network</p>
                    <p className="text-sm text-orange-700 mb-3">
                      Please switch to {selectedChain.chain.name} (Chain ID: {selectedChain.chain.id})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Source Chain</CardTitle>
            </CardHeader>
            <CardContent>
              <ChainSelector
                selectedChain={selectedChain}
                onChainSelect={setSelectedChain}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Balance on {selectedChain.chain.name}:</span>
                </div>
                <div className="flex items-center space-x-2">
                  {balanceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900">{parseFloat(balance).toFixed(2)} USDC</span>
                      {balanceNum > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setAmount(balance)} className="h-6 px-2 text-xs">
                          MAX
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={fetchBalance} className="h-6 px-2 text-xs">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
                disabled={executing || balanceLoading || isWrongChain}
                max={balance}
                step="0.01"
              />

              {executing && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Processing CCTP Bridge...</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">{progress}% complete</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={() => execute(amount)}
                disabled={!isDepositValid}
                className="w-full"
                size="lg"
              >
                {executing
                  ? `Depositing... ${progress}%`
                  : !amount
                  ? 'Enter Amount'
                  : amountNum > balanceNum
                  ? 'Insufficient Balance'
                  : isWrongChain
                  ? `Switch to ${selectedChain.chain.name}`
                  : `Deposit ${amount} USDC`}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Bridge Route</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{selectedChain.chain.name}</div>
                    <div className="text-sm text-gray-600">Source</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{amount || '0.00'} USDC</div>
                    <div className="text-xs text-gray-600">Domain {selectedChain.domain}</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="h-12 w-px bg-gradient-to-b from-purple-500 to-blue-500" />
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-semibold">Sui Testnet</div>
                    <div className="text-sm text-gray-600">Destination</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{amount || '0.00'} USDC</div>
                    <div className="text-xs text-gray-600">Domain 8</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Bridge Fee</span>
                    <span className="font-semibold text-gray-900">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Est. Time</span>
                    <span className="font-semibold text-gray-900">~15 mins</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}