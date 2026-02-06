'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useConnection } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { useLiFiBridge } from '@/lib/lifi/hooks'
import { getUSDCAddress } from '@/lib/lifi/constants'
import { calculateRouteFees, estimateRouteDuration } from '@/lib/lifi/client'
import { formatUSDCWithSign } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { ArcRouteVisualizer } from '../routing/arc-route-visualizer'

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', fee: '$5-20', time: '15 min' },
  { id: 8453, name: 'Base', fee: '$0.10', time: '2 min' },
  { id: 42161, name: 'Arbitrum', fee: '$0.50', time: '10 min' },
  { id: 10, name: 'Optimism', fee: '$0.50', time: '10 min' },
  { id: 137, name: 'Polygon', fee: '$0.10', time: '5 min' },
  { id: 324, name: 'zkSync Era', fee: '$0.20', time: '8 min' },
  { id: 59144, name: 'Linea', fee: '$0.15', time: '6 min' },
  { id: 534352, name: 'Scroll', fee: '$0.15', time: '7 min' },
]

export function DepositForm() {
  const { address, isConnected } = useConnection()
  const [fromChainId, setFromChainId] = useState(1)
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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deposit USDC</CardTitle>
          <CardDescription>Connect your wallet to start depositing</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-500">Please connect your wallet to continue</p>
        </CardContent>
      </Card>
    )
  }

  const selectedChain = SUPPORTED_CHAINS.find(c => c.id === fromChainId)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deposit USDC</CardTitle>
          <CardDescription>
            Deposit from {SUPPORTED_CHAINS.length}+ chains - we'll route through Arc to your vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chain Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              From Chain
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SUPPORTED_CHAINS.map((chain) => (
                <motion.button
                  key={chain.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFromChainId(chain.id)}
                  className={cn(
                    'flex flex-col items-start space-y-1 rounded-xl border-2 p-3 transition-all duration-200',
                    fromChainId === chain.id
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-gray-900">{chain.name}</span>
                    {fromChainId === chain.id && (
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Badge variant="secondary" className="text-xs">
                      {chain.fee}
                    </Badge>
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
                className="text-2xl font-semibold pr-20"
                disabled={executing}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                USDC
              </div>
            </div>
          </div>

          {/* Route Preview */}
          {selectedRoute && amount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-4 border border-purple-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Route Found</span>
                <Badge variant="success">Best Price</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Fee:</span>
                  <span className="font-semibold text-gray-900">
                    ${calculateRouteFees(selectedRoute).total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-semibold text-gray-900">
                    ~{estimateRouteDuration(selectedRoute)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">You'll Receive:</span>
                  <span className="font-semibold text-purple-700">
                    ~{formatUSDCWithSign(selectedRoute.steps[selectedRoute.steps.length - 1].estimate.toAmount)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Execution Progress */}
          {executing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-blue-50 p-4 border border-blue-100"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium text-blue-900">
                  {currentStep || 'Processing...'}
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
              <p className="text-sm text-blue-700 mt-2">{progress}% complete</p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-50 p-4 border border-red-100"
            >
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Deposit Button */}
          <Button
            onClick={handleDeposit}
            disabled={!amount || !selectedRoute || executing || findingRoutes}
            loading={executing || findingRoutes}
            size="lg"
            className="w-full"
          >
            {executing ? (
              `Depositing... ${progress}%`
            ) : findingRoutes ? (
              'Finding Best Route...'
            ) : (
              <>
                Deposit {amount || '0'} USDC
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Arc Routing Visualization - Show when route is found */}
      {selectedRoute && amount && selectedChain && (
        <ArcRouteVisualizer
          fromChain={selectedChain.name}
          amount={amount}
          estimatedTime={estimateRouteDuration(selectedRoute)}
          fees={{
            lifi: calculateRouteFees(selectedRoute).feeCosts,
            arc: '0.10',
            total: calculateRouteFees(selectedRoute).total,
          }}
        />
      )}
    </div>
  )
}