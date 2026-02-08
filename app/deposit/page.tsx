'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection, useSwitchChain } from 'wagmi';
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Wallet, CheckCircle2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
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
import { useAutoVaultDeposit } from '@/lib/cctp/useAutoVaultDeposit';


function SuccessView({ 
  txHash, 
  messageHash,
  autoDepositStatus, 
  vaultTxHash,
  mintTxHash,
  autoDepositError,
  autoDepositProgress,
  selectedChain, 
  amount,
  reset 
}: {
  txHash: string;
  messageHash: string | null;
  autoDepositStatus: 'idle' | 'attestation' | 'minting' | 'depositing' | 'complete' | 'failed';
  vaultTxHash: string | null;
  mintTxHash: string | null;
  autoDepositError: string | null;
  autoDepositProgress: number;
  selectedChain: CCTPChainConfig;
  amount: string;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Deposit</h2>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${autoDepositProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mb-6">{autoDepositProgress}% Complete</p>
            
            {/* Step 1: Burn on EVM */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-4 bg-green-50 rounded-lg border border-green-200"
            >
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-bold text-green-900">✓ Step 1: Burned on {selectedChain.chain.name}</h3>
              <p className="text-sm text-green-700 mb-2">
                {amount} USDC burned successfully
              </p>
              <a 
                href={`${selectedChain.chain.blockExplorers?.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-600 hover:underline flex items-center justify-center gap-1"
              >
                View on Explorer <ExternalLink className="h-3 w-3" />
              </a>
            </motion.div>

            {/* Step 2: Circle Attestation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`w-full p-4 rounded-lg border ${
                autoDepositStatus === 'attestation' 
                  ? 'bg-blue-50 border-blue-200 animate-pulse' 
                  : autoDepositStatus === 'minting' || autoDepositStatus === 'depositing' || autoDepositStatus === 'complete'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {autoDepositStatus === 'attestation' ? (
                <>
                  <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
                  <h3 className="font-bold text-blue-900">Step 2: Waiting for Circle Attestation</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Circle is verifying your burn transaction (~7-10 minutes) This should be super fast when ARC releases V2
                  </p>
                  {messageHash && (
                    <a
                      href={`https://iris-api-sandbox.circle.com/attestations/${messageHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Check Attestation Status
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </>
              ) : (autoDepositStatus === 'minting' || autoDepositStatus === 'depositing' || autoDepositStatus === 'complete') ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-bold text-green-900">✓ Step 2: Attestation Received</h3>
                  <p className="text-sm text-green-700">Circle verified your transaction</p>
                </>
              ) : (
                <>
                  <div className="h-8 w-8 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-gray-600 text-lg">2</span>
                  </div>
                  <h3 className="font-bold text-gray-600">Step 2: Pending...</h3>
                </>
              )}
            </motion.div>

            {/* Step 3: Mint on Sui */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`w-full p-4 rounded-lg border ${
                autoDepositStatus === 'minting' 
                  ? 'bg-purple-50 border-purple-200 animate-pulse'
                  : autoDepositStatus === 'depositing' || autoDepositStatus === 'complete'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {autoDepositStatus === 'minting' ? (
                <>
                  <Loader2 className="h-8 w-8 text-purple-600 mx-auto mb-2 animate-spin" />
                  <h3 className="font-bold text-purple-900">Step 3: Minting USDC on Sui</h3>
                  <p className="text-sm text-purple-700">
                    Creating your USDC on Sui blockchain...
                  </p>
                </>
              ) : (autoDepositStatus === 'depositing' || autoDepositStatus === 'complete') ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-bold text-green-900">✓ Step 3: USDC Minted on Sui</h3>
                  <p className="text-sm text-green-700 mb-2">
                    {amount} USDC now on Sui blockchain
                  </p>
                  {mintTxHash && (
                    <a 
                      href={`https://suiscan.xyz/testnet/tx/${mintTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-600 hover:underline flex items-center justify-center gap-1"
                    >
                      View Mint Tx <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </>
              ) : (
                <>
                  <div className="h-8 w-8 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-gray-600 text-lg">3</span>
                  </div>
                  <h3 className="font-bold text-gray-600">Step 3: Pending...</h3>
                </>
              )}
            </motion.div>

            {/* Step 4: Vault Deposit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`w-full p-4 rounded-lg border ${
                autoDepositStatus === 'depositing' 
                  ? 'bg-indigo-50 border-indigo-200 animate-pulse'
                  : autoDepositStatus === 'complete'
                  ? 'bg-green-50 border-green-200'
                  : autoDepositStatus === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {autoDepositStatus === 'depositing' ? (
                <>
                  <Loader2 className="h-8 w-8 text-indigo-600 mx-auto mb-2 animate-spin" />
                  <h3 className="font-bold text-indigo-900">Step 4: Depositing to Vault</h3>
                  <p className="text-sm text-indigo-700">
                    Adding {amount} USDC to your yield-earning vault...
                  </p>
                </>
              ) : autoDepositStatus === 'complete' ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  </motion.div>
                  <h3 className="font-bold text-green-900 text-lg">🎉 Deposit Complete!</h3>
                  <p className="text-sm text-green-700 mb-3">
                    {amount} USDC is now earning yield on Sui!
                  </p>
                  {vaultTxHash && (
                    <a 
                      href={`https://suiscan.xyz/testnet/tx/${vaultTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-600 hover:underline flex items-center justify-center gap-1"
                    >
                      View Vault Deposit <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </>
              ) : autoDepositStatus === 'failed' ? (
                <>
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-bold text-red-900">Step 4: Failed</h3>
                  <p className="text-sm text-red-700 mb-2">{autoDepositError}</p>
                  {mintTxHash && (
                    <p className="text-xs text-red-600 mb-3">
                      Your USDC was minted on Sui. You can manually deposit from the vault page.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="h-8 w-8 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-gray-600 text-lg">4</span>
                  </div>
                  <h3 className="font-bold text-gray-600">Step 4: Pending...</h3>
                </>
              )}
            </motion.div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 w-full">
              <Button onClick={reset} variant="outline" className="flex-1">
                New Deposit
              </Button>
              <Link href="/vault" className="flex-1">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={autoDepositStatus !== 'complete'}
                >
                  {autoDepositStatus === 'complete' ? 'View Vault →' : 'Processing...'}
                </Button>
              </Link>
            </div>

            {(autoDepositStatus === 'attestation' || autoDepositStatus === 'minting' || autoDepositStatus === 'depositing') && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 mt-4 flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                Auto-updating... You can safely close this tab.
              </motion.p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DepositPage() {
  const { address, isConnected, chainId } = useConnection();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  
  const [selectedChain, setSelectedChain] = useState<CCTPChainConfig>(CCTP_CHAINS.sepolia);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showMultiChain, setShowMultiChain] = useState(true);
  const [switchingChain, setSwitchingChain] = useState(false);

  const [suiRecipient] = useState(
    process.env.NEXT_PUBLIC_SUI_VAULT_OWNER_ADDRESS || 
    '0xfed85cd8183b98b8d82b1e9632d4d78076135193068f7983b10382fa54979a40'
  );

  const { balances, totalBalance, loading: multiChainLoading, refetch } = useMultiChainBalance(
    address 
  );
  
  const { execute, executing, progress, error, success, txHash, message, messageHash, reset } = useCCTPBridge(selectedChain);
    
  const { 
    status: autoDepositStatus, 
    vaultTxHash, 
    mintTxHash,              
    error: autoDepositError, 
    progress: autoDepositProgress  
  } = useAutoVaultDeposit(
    txHash,
    address,
    amount,
    message ?? undefined,     
    messageHash ?? undefined  
  );

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

  const fetchBalance = async () => {
    if (!address) return;
    
    setBalanceLoading(true);
    try {
      const client = createPublicClient({
        chain: selectedChain.chain,
        transport: fallback([
          http(selectedChain.rpcUrl),
          http(), 
        ], {
          rank: true,
          retryCount: 3,
          retryDelay: 2000,
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

  const handleChainSelect = async (chain: CCTPChainConfig) => {
    setSelectedChain(chain);
    
    // If user is on wrong chain, automatically trigger switch
    if (chainId !== chain.chain.id) {
      setSwitchingChain(true);
      try {
        await switchChain({ chainId: chain.chain.id });
      } catch (error) {
        console.error('Failed to switch chain:', error);
      } finally {
        setSwitchingChain(false);
      }
    }
  };

  const balanceNum = parseFloat(balance);
  const amountNum = parseFloat(amount || '0');
  const isWrongChain = chainId !== selectedChain.chain.id;
  const isDepositValid = amount && amountNum > 0 && amountNum <= balanceNum && !executing && !isWrongChain;

  if (!isConnected) return null;

  // Show success view with auto-deposit tracking
  if (success && txHash) {
    return (
      <SuccessView 
        txHash={txHash}
        messageHash={messageHash}
        autoDepositStatus={autoDepositStatus}
        vaultTxHash={vaultTxHash}
        mintTxHash={mintTxHash}                    
        autoDepositError={autoDepositError}
        autoDepositProgress={autoDepositProgress}  
        selectedChain={selectedChain}
        amount={amount}
        reset={reset}
      />
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
          Deposit from any supported chain → Auto-deposit to Sui Vault via Circle CCTP
        </p>
      </div>

      {/* Multi-Chain Balance Overview */}
      <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 relative z-50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your USDC Across Chains</CardTitle>
          <Button 
            onClick={() => setShowMultiChain(!showMultiChain)} 
            variant="outline"
            size="sm"
          >
            {showMultiChain ? 'Hide' : 'Show'} Balances
          </Button>
        </CardHeader>
        {showMultiChain && (
          <CardContent>
            {multiChainLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : balances.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {balances.map((bal) => (
                    <div
                      key={bal.chainId}
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {bal.chainName.charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-gray-600">{bal.chainName}</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {bal.formattedBalance} <span className="text-sm text-gray-500">USDC</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Total Balance:</span>
                  <span className="text-xl font-bold text-gray-900">{totalBalance} USDC</span>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No USDC found</p>
                <p className="text-sm text-gray-500 mt-1">You don't have USDC on any supported chains</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {isWrongChain && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 mb-1">Wrong Network</p>
                    <p className="text-sm text-orange-700 mb-3">
                      Please switch to {selectedChain.chain.name} (Chain ID: {selectedChain.chain.id})
                    </p>
                    <Button
                      onClick={() => switchChain({ chainId: selectedChain.chain.id })}
                      disabled={switchingChain}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {switchingChain ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Switching...
                        </>
                      ) : (
                        `Switch to ${selectedChain.chain.name}`
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="relative z-40 overflow-visible">
            <CardHeader>
              <CardTitle className="text-lg">Source Chain</CardTitle>
            </CardHeader>
            <CardContent className="overflow-visible">
              <ChainSelector
                selectedChain={selectedChain}
                onChainSelect={handleChainSelect}
              />
            </CardContent>
          </Card>

          <Card className="relative z-10 overflow-visible">
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
                onClick={() => execute(amount, suiRecipient)}  
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
                    <span className="font-semibold text-gray-900">~3 mins</span>
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