'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConnection } from 'wagmi'
import { motion } from 'framer-motion'
import { ArrowUpRight, TrendingUp, Wallet } from 'lucide-react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { VaultBalance } from '@/components/vault/vault-balance'
import { TransactionHistory } from '@/components/vault/transaction-history'
import { ENSProfile } from '@/components/ens/ens-profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/loading'
import { SUI_CONFIG } from '@/lib/utils/constants'
import Link from 'next/link'

export default function DashboardPage() {
  const { address, isConnected } = useConnection()
  const router = useRouter()
  const vaultId = SUI_CONFIG.VAULT_OBJECT_ID

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  if (!isConnected) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-coolvetica text-4xl font-bold gradient-text mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back! Here's your portfolio overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/deposit">
              <Button size="lg">
                <ArrowUpRight className="mr-2 h-5 w-5" />
                Deposit
              </Button>
            </Link>
            <Link href="/vault">
              <Button size="lg" variant="outline">
                <Wallet className="mr-2 h-5 w-5" />
                Vault
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <StatsCards vaultId={vaultId} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vault Balance */}
            <VaultBalance vaultId={vaultId} />

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your vault</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link href="/deposit">
                      <button className="w-full flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <ArrowUpRight className="h-6 w-6 text-purple-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Deposit</span>
                        <span className="text-sm text-gray-500 mt-1">Add USDC</span>
                      </button>
                    </Link>

                    <Link href="/vault">
                      <button className="w-full flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Wallet className="h-6 w-6 text-emerald-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Withdraw</span>
                        <span className="text-sm text-gray-500 mt-1">Take out funds</span>
                      </button>
                    </Link>

                    <Link href="/yield">
                      <button className="w-full flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Strategies</span>
                        <span className="text-sm text-gray-500 mt-1">Optimize yield</span>
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Transaction History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TransactionHistory vaultId={vaultId} limit={10} />
            </motion.div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* ENS Profile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ENSProfile address={address} />
            </motion.div>

            {/* Portfolio Performance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">24h Change</span>
                    <span className="text-sm font-semibold text-emerald-700">+2.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">7d Change</span>
                    <span className="text-sm font-semibold text-emerald-700">+8.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">30d Change</span>
                    <span className="text-sm font-semibold text-emerald-700">+12.3%</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">All Time</span>
                      <span className="text-lg font-bold text-emerald-700">+15.6%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Network Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Network Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sui Network</span>
                    <span className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-emerald-700">Healthy</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Arc Network</span>
                    <span className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-emerald-700">Healthy</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bridge Status</span>
                    <span className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-emerald-700">Online</span>
                    </span>
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