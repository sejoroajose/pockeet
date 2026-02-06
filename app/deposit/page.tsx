'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useConnection } from 'wagmi'
import { motion } from 'framer-motion'
import { ArrowUpRight, Loader2, CheckCircle2, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loading'
import { useLiFiBridge } from '@/lib/lifi/hooks'
import { getUSDCAddress, CHAIN_METADATA } from '@/lib/lifi/constants'
import { calculateRouteFees, estimateRouteDuration } from '@/lib/lifi/client'
import { formatUSDCWithSign } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { ArcRouteVisualizer } from '@/components/routing/arc-route-visualizer'

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', fee: '$5-20', time: '15 min', color: '#627EEA' },
  { id: 8453, name: 'Base', fee: '$0.10', time: '2 min', color: '#0052FF' },
  { id: 42161, name: 'Arbitrum', fee: '$0.50', time: '10 min', color: '#28A0F0' },
  { id: 10, name: 'Optimism', fee: '$0.50', time: '10 min', color: '#FF0420' },
  { id: 137, name: 'Polygon', fee: '$0.10', time: '5 min', color: '#8247E5' },
  { id: 43114, name: 'Avalanche', fee: '$0.30', time: '8 min', color: '#E84142' },
  { id: 56, name: 'BSC', fee: '$0.20', time: '6 min', color: '#F3BA2F' },
  { id: 324, name: 'zkSync Era', fee: '$0.15', time: '7 min', color: '#8C8DFC' },
]

export default function DepositPage() {
  const { address, isConnected } = useConnection()
  const router = useRouter()
  const [fromChainId, setFromChainId] = useState(8453) // Default to Base
  const [amount, setAmount] = useState('')
  
  const {
    routes,
    selectedRoute,
    loading: findingRoutes,
    execute,
    executing,
    progress,
    currentStep,
    txHash,
    error,
    reset,
  } = useLiFiBridge({
    fromChainId,
    toChainId: 5042002, // Arc testnet
    tokenAddress: getUSDCAddress(fromChainId),
    order: 'CHEAPEST',
  })

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 6) return
    setAmount(cleaned)
  }

  const handleDeposit = async () => {
    if (!amount || !selectedRoute) return
    try {
      await execute()
    } catch (err) {
      console.error('Deposit failed:', err)
    }
  }

  if (!isConnected) {
    return <PageLoader />
  }

  const selectedChain = SUPPORTED_CHAINS.find(c => c.id === fromChainId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-2 mb-2">
            <ArrowUpRight className="h-8 w-8 text-purple-600" />
            <h1 className="font-coolvetica text-4xl font-bold gradient-text">
              Deposit USDC
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Deposit from {SUPPORTED_CHAINS.length}+ chains → Arc Hub → Sui Vault
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Form (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle>Select Chain & Amount</CardTitle>
                <CardDescription>
                  Choose your source chain and enter USDC amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chain Grid */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    From Chain ({SUPPORTED_CHAINS.length} supported)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SUPPORTED_CHAINS.map((chain) => (
                      <motion.button
                        key={chain.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setFromChainId(chain.id)}
                        className={cn(
                          'flex flex-col items-start p-3 rounded-xl border-2 transition-all',
                          fromChainId === chain.id
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div 
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: chain.color }}
                          >
                            {chain.name[0]}
                          </div>
                          {fromChainId === chain.id && (
                            <CheckCircle2 className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{chain.name}</p>
                        <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {chain.fee}
                          </Badge>
                          <span>•</span>
                          <span>{chain.time}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Amount (USDC)
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="text-3xl font-bold pr-24 h-16"
                      disabled={executing}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                      USDC
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Min: $1.00 • Max: $1,000,000
                  </p>
                </div>

                {/* Route Summary */}
                {selectedRoute && amount && !executing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900">Best Route Found</span>
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Lowest Fee
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Total Fee</p>
                        <p className="font-bold text-purple-700">
                          ${calculateRouteFees(selectedRoute).total}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Est. Time</p>
                        <p className="font-bold text-purple-700">
                          ~{estimateRouteDuration(selectedRoute)} min
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">You Receive</p>
                        <p className="font-bold text-emerald-700">
                          ~{formatUSDCWithSign(selectedRoute.steps[selectedRoute.steps.length - 1].estimate.toAmount)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Execution Progress */}
                {executing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-900">
                          {currentStep || 'Processing transaction...'}
                        </p>
                        <p className="text-sm text-blue-700">{progress}% complete</p>
                      </div>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 border-2 border-red-200"
                  >
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </motion.div>
                )}

                {/* Deposit Button */}
                <Button
                  onClick={handleDeposit}
                  disabled={!amount || !selectedRoute || executing || findingRoutes || parseFloat(amount) < 1}
                  loading={executing || findingRoutes}
                  size="lg"
                  className="w-full h-14 text-lg"
                >
                  {executing ? (
                    `Depositing... ${progress}%`
                  ) : findingRoutes ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Finding Best Route...
                    </>
                  ) : (
                    <>
                      Deposit {amount || '0'} USDC
                      <ArrowUpRight className="ml-2 h-6 w-6" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Arc Route Visualization */}
            {selectedRoute && amount && selectedChain && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ArcRouteVisualizer
                  fromChain={selectedChain.name}
                  amount={amount}
                  estimatedTime={estimateRouteDuration(selectedRoute)}
                  fees={{
                    bridge: calculateRouteFees(selectedRoute).feeCosts,
                    arc: '0.10',
                    total: calculateRouteFees(selectedRoute).total,
                  }}
                />
              </motion.div>
            )}

            {/* Info Box */}
            {!amount && (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    <span>How It Works</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-purple-700">1.</span>
                    <p>Select your source chain and enter USDC amount</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-purple-700">2.</span>
                    <p>LI.FI finds the best bridge route to Arc Network</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-purple-700">3.</span>
                    <p>Arc mints native USDC via Circle CCTP</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-purple-700">4.</span>
                    <p>Funds deposited to your Sui vault - start earning!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}