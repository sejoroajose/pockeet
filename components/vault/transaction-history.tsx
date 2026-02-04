'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useVaultTransactions } from '@/lib/sui/hooks'
import { formatUSDCWithSign, formatRelativeTime, shortenTxHash } from '@/lib/utils/formatters'
import { EXTERNAL_URLS } from '@/lib/utils/constants'

interface TransactionHistoryProps {
  vaultId?: string
  limit?: number
}

export function TransactionHistory({ vaultId, limit = 10 }: TransactionHistoryProps) {
  const { transactions, loading: transactionsLoading } = useVaultTransactions(vaultId, 'testnet', limit)

  if (transactionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your vault transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your vault transactions</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-sm text-gray-400 mt-1">Your activity will appear here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          {transactions.length} recent transaction{transactions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.map((tx, index) => {
            const isDeposit = tx.type === 'deposit'
            
            return (
              <motion.div
                key={tx.txDigest || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  {/* Icon */}
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    isDeposit
                      ? 'bg-gradient-to-br from-emerald-100 to-green-100'
                      : 'bg-gradient-to-br from-blue-100 to-purple-100'
                  }`}>
                    {isDeposit ? (
                      <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ArrowDownLeft className="h-5 w-5 text-blue-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {isDeposit ? 'Deposit' : 'Withdrawal'}
                      </span>
                      <Badge variant={isDeposit ? 'success' : 'default'} className="text-xs">
                        {formatUSDCWithSign(tx.amount)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(Number(tx.timestamp || Date.now()))}
                      </span>
                      {tx.txDigest && (
                        <>
                          <span className="text-gray-300">•</span>
                          <button
                            onClick={() => window.open(
                              `${EXTERNAL_URLS.SUI_EXPLORER}/tx/${tx.txDigest}`,
                              '_blank'
                            )}
                            className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                          >
                            <span className="font-mono">{shortenTxHash(tx.txDigest)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    isDeposit ? 'text-emerald-700' : 'text-blue-700'
                  }`}>
                    {isDeposit ? '+' : '-'}{formatUSDCWithSign(tx.amount)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}