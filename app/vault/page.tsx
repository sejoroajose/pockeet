'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConnection } from 'wagmi'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp } from 'lucide-react'
import { VaultBalance } from '@/components/vault/vault-balance'
import { TransactionHistory } from '@/components/vault/transaction-history'
import { WithdrawForm } from '@/components/vault/withdraw-form'
import { YieldSimulator } from '@/components/vault/yield-simulator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loading'
import { SUI_CONFIG } from '@/lib/utils/constants'
import { useVaultInfo } from '@/lib/sui/hooks'
import { formatAPY } from '@/lib/utils/formatters'

export default function VaultPage() {
  const { address, isConnected } = useConnection()
  const router = useRouter()
  const vaultId = SUI_CONFIG.VAULT_OBJECT_ID
  const { info } = useVaultInfo(vaultId)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  if (!isConnected) {
    return <PageLoader />
  }

  const totalDeposited = parseFloat(info?.totalDeposited || '0')
  const yieldEarned = parseFloat(info?.yieldEarned || '0')
  const userBalance = parseFloat(info?.userBalance || '0')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="h-8 w-8 text-purple-600" />
            <h1 className="font-coolvetica text-4xl font-bold gradient-text">
              Your Vault
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Manage your deposits, withdrawals, and yield
          </p>
        </motion.div>

        {/* Vault Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Your Balance</span>
                  </div>
                  <p className="text-2xl font-coolvetica font-bold text-gray-900">
                    {userBalance.toFixed(4)} SUI
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Yield Earned</span>
                  </div>
                  <p className="text-2xl font-coolvetica font-bold text-emerald-700">
                    {yieldEarned.toFixed(4)} SUI
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-600">Current APY</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-coolvetica font-bold text-blue-700">
                      {formatAPY(info?.apy || '0')}
                    </p>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-600">Total Gain</span>
                  </div>
                  <p className="text-2xl font-coolvetica font-bold text-purple-700">
                    +{userBalance > 0 ? ((yieldEarned / userBalance) * 100).toFixed(2) : '0.00'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Balance & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vault Balance */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VaultBalance vaultId={vaultId} />
            </motion.div>

            {/* Withdraw Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <WithdrawForm vaultId={vaultId} />
            </motion.div>

            {/* Yield Strategy Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Active Strategy</CardTitle>
                    <Badge variant="default">Moderate Risk</Badge>
                  </div>
                  <CardDescription>
                    Your funds are deployed in the Moderate yield strategy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50">
                      <p className="text-sm text-gray-600 mb-1">Target APY</p>
                      <p className="text-xl font-bold text-emerald-700">10-15%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
                      <p className="text-sm text-gray-600 mb-1">Protocol</p>
                      <p className="text-lg font-semibold text-blue-700">Navi</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <p className="text-lg font-semibold text-purple-700">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </motion.div>
          </div>

          {/* Right Column - History & Yield Simulator */}
          <div className="space-y-6">
            {/* Yield Simulator - NEW */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <YieldSimulator vaultId={vaultId} />
            </motion.div>

            {/* Transaction History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TransactionHistory vaultId={vaultId} limit={15} />
            </motion.div>

            {/* Vault Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Vault Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <Badge variant="secondary">Sui Testnet</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Deposited</span>
                    <span className="font-semibold text-gray-900">
                      {totalDeposited.toFixed(4)} SUI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Yield</span>
                    <span className="font-semibold text-emerald-700">
                      {yieldEarned.toFixed(4)} SUI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vault Status</span>
                    <span className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="font-semibold text-emerald-700">Active</span>
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={() => window.open(
                        `https://suiscan.xyz/testnet/object/${vaultId}`,
                        '_blank'
                      )}
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors text-sm"
                    >
                      View on Explorer →
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}