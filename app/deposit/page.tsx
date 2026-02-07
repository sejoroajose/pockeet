'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { ArrowLeft, Loader2, Wallet, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatUnits } from 'viem';
import { useCCTPBridge } from '@/lib/arc/hook';
import { CCTPRouteDisplay } from '@/components/routing/cctp-route-display';
import { getArcUSDCBalance } from '@/lib/arc/client';

const ARC_TESTNET_CHAIN_ID = 5042002;

export default function DepositPage() {
  const { address, isConnected, chainId } = useConnection();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  // Fetch balance using Arc client
  const fetchBalance = async () => {
    if (!address) return;
    
    setBalanceLoading(true);
    try {
      console.log('Fetching balance for:', address);
      const balanceWei = await getArcUSDCBalance(address);
      const balanceFormatted = formatUnits(balanceWei, 6);
      console.log('Balance (wei):', balanceWei.toString());
      console.log('Balance (formatted):', balanceFormatted);
      setBalance(balanceFormatted);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0');
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (address && chainId === ARC_TESTNET_CHAIN_ID) {
      fetchBalance();
    }
  }, [address, chainId]);

  const balanceNum = parseFloat(balance);
  const amountNum = parseFloat(amount || '0');

  const { execute, executing, progress, error, success, txHash, reset } = useCCTPBridge();

  const isWrongChain = chainId !== ARC_TESTNET_CHAIN_ID;
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
                  Your USDC is being bridged to Sui via Circle CCTP
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
          Deposit from Arc Network → Sui via Circle CCTP
        </p>
      </div>

      {/* Debug Info Card */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Connected Address:</span>
              <span className="font-mono text-gray-900">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Chain:</span>
              <span className="font-semibold text-gray-900">{chainId === ARC_TESTNET_CHAIN_ID ? 'Arc Testnet ✓' : `Chain ${chainId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">USDC Contract:</span>
              <span className="font-mono text-xs text-gray-900">{process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Balance (raw):</span>
              <span className="font-semibold text-gray-900">{balance} USDC</span>
            </div>
          </div>
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
                      Please switch to Arc Testnet (Chain ID: 5042002)
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
              <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Arc Testnet</div>
                    <div className="text-sm text-gray-600">Circle's USDC Hub</div>
                  </div>
                  <Badge variant="default">Selected</Badge>
                </div>
              </div>
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

              {balanceNum === 0 && !balanceLoading && !isWrongChain && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium mb-2">No USDC found on Arc Testnet</p>
                  <p className="text-xs text-yellow-700">
                    Please ensure you:
                    <br />1. Are connected to Arc Testnet (Chain ID: 5042002)
                    <br />2. Have USDC at address: {process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036...'}
                    <br />3. Check your balance on Arc Explorer
                  </p>
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
                  ? 'Switch to Arc Testnet'
                  : `Deposit ${amount} USDC`}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          {amount && parseFloat(amount) > 0 && (
            <CCTPRouteDisplay amount={amount} />
          )}
        </div>
      </div>
    </div>
  );
}