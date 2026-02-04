'use client'

import { motion } from 'framer-motion'
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useVaultInfo } from '@/lib/sui/hooks'
import { formatUSDCWithSign, formatAPY } from '@/lib/utils/formatters'

interface VaultBalanceProps {
  vaultId?: string
}

export function VaultBalance({ vaultId }: VaultBalanceProps) {
  const { info, loading } = useVaultInfo(vaultId)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded-xl" />
            <div className="h-8 bg-gray-200 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!info) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          No vault connected
        </CardContent>
      </Card>
    )
  }

  const balanceNumber = parseFloat(info.userBalance)
  const yieldNumber = parseFloat(info.yieldEarned)
  const apyNumber = parseFloat(info.apy)

  const performancePercentage =
    balanceNumber > 0 ? (yieldNumber / balanceNumber) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-transparent opacity-50" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-purple-600" />
            <span>Your Balance</span>
          </CardTitle>
          <Badge variant="success">
            <TrendingUp className="h-3 w-3 mr-1" />
            {formatAPY(info.apy)} APY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Main Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-gray-600 mb-1">Total Balance</p>
          <p className="text-4xl font-coolvetica font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
            {formatUSDCWithSign(info.userBalance)}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-4 border border-emerald-100"
          >
            <div className="flex items-center space-x-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Yield Earned</span>
            </div>
            <p className="text-xl font-semibold text-emerald-900">
              {formatUSDCWithSign(info.yieldEarned)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-4 border border-blue-100"
          >
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Current APY</span>
            </div>
            <p className="text-xl font-semibold text-blue-900">
              {formatAPY(info.apy)}
            </p>
          </motion.div>
        </div>

        {/* Performance Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
        >
          <span className="text-sm text-gray-600">Performance</span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {yieldNumber > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-gray-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  yieldNumber > 0 ? 'text-emerald-700' : 'text-gray-500'
                }`}
              >
                {yieldNumber > 0 ? '+' : ''}
                {performancePercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}