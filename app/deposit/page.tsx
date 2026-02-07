'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection, useReadContract } from 'wagmi';
import { ArrowLeft, Loader2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLiFiBridge } from '@/lib/lifi/hooks';
import { ArcRouteDisplay } from '@/components/routing/arc-route-simple';
import { getChainsWithBalance, type ChainWithBalance } from '@/lib/lifi/chains-with-balance';
import { formatUnits } from 'viem';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function DepositPage() {
  const { address, isConnected } = useConnection();
  const router = useRouter();
  const [fromChainId, setFromChainId] = useState(0);
  const [amount, setAmount] = useState('');
  const [chains, setChains] = useState<ChainWithBalance[]>([]);
  const [chainsLoading, setChainsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  useEffect(() => {
    async function loadChains() {
      if (!address) return;
      setChainsLoading(true);
      const result = await getChainsWithBalance(address);
      setChains(result);
      if (result.length > 0 && fromChainId === 0) {
        setFromChainId(result[0].id);
      }
      setChainsLoading(false);
    }
    loadChains();
  }, [address]);

  const selectedChain = chains.find((c) => c.id === fromChainId);

  const { data: balanceData, isLoading: balanceLoading } = useReadContract({
    address: selectedChain?.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: fromChainId,
    query: { enabled: !!address && !!selectedChain },
  });

  const balance = balanceData ? formatUnits(balanceData, 6) : '0';
  const balanceNum = parseFloat(balance);
  const amountNum = parseFloat(amount || '0');

  const { selectedRoute, loading: findingRoutes, execute, executing, progress, error } = useLiFiBridge({
    fromChainId,
    toChainId: 5042002,
    tokenAddress: selectedChain?.usdc || '',
    amount,
    order: 'CHEAPEST',
  });

  if (!isConnected) return null;

  if (chainsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Scanning chains for USDC...</p>
        </div>
      </div>
    );
  }

  if (chains.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No USDC Found</h1>
          <p className="text-gray-600 mb-6">
            You don't have USDC on any supported chains. Get USDC from an exchange or faucet to get started.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const zkChains = chains.filter((c) => c.type === 'ZK');
  const l2Chains = chains.filter((c) => c.type === 'L2');

  const isDepositValid =
    amount && amountNum > 0 && amountNum <= balanceNum && selectedRoute && !executing && !findingRoutes;

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
          Deposit from {chains.length} chains with USDC ({zkChains.length} ZK, {l2Chains.length} L2)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Source Chain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {zkChains.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="default" className="text-xs">
                      ZK Rollups
                    </Badge>
                    <span className="text-xs text-gray-600">{zkChains.length} chains</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {zkChains.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => setFromChainId(chain.id)}
                        className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors text-left ${
                          fromChainId === chain.id
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold">{chain.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{parseFloat(chain.balance).toFixed(2)} USDC</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {l2Chains.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      L2 Chains
                    </Badge>
                    <span className="text-xs text-gray-600">{l2Chains.length} chains</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {l2Chains.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => setFromChainId(chain.id)}
                        className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors text-left ${
                          fromChainId === chain.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold">{chain.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{parseFloat(chain.balance).toFixed(2)} USDC</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                  <span className="text-sm text-gray-600">Balance:</span>
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
                disabled={executing || balanceLoading}
                max={balance}
                step="0.01"
              />

              {findingRoutes && amount && amountNum > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Finding route...</span>
                  </div>
                </div>
              )}

              {executing && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Processing...</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button onClick={execute} disabled={!isDepositValid} className="w-full" size="lg">
                {executing
                  ? `Depositing... ${progress}%`
                  : findingRoutes
                  ? 'Finding Route...'
                  : !amount
                  ? 'Enter Amount'
                  : amountNum > balanceNum
                  ? 'Insufficient Balance'
                  : !selectedRoute
                  ? 'Waiting for Route...'
                  : `Deposit ${amount} USDC`}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedChain && amount && parseFloat(amount) > 0 && (
            <ArcRouteDisplay fromChain={selectedChain.name} amount={amount} />
          )}
        </div>
      </div>
    </div>
  );
}