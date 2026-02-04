'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownToLine, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { useVaultWithdraw, useVaultInfo } from '@/lib/sui/hooks'
import { formatUSDCWithSign, formatAmountInput } from '@/lib/utils/formatters'

interface WithdrawFormProps {
  vaultId?: string
}

export function WithdrawForm({ vaultId }: WithdrawFormProps) {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const { info } = useVaultInfo(vaultId)
  const { withdraw, withdrawing, error, txDigest, reset } = useVaultWithdraw(vaultId)

  const handleAmountChange = (value: string) => {
    const cleaned = formatAmountInput(value, 6)
    setAmount(cleaned)
  }

  const handleMaxClick = () => {
    if (info?.userBalance) {
      setAmount(info.userBalance)
    }
  }

  const handleWithdraw = async () => {
    if (!amount || !vaultId) return
    
    try {
      // Convert to raw USDC units (6 decimals)
      const rawAmount = (parseFloat(amount) * 1_000_000).toString()
      await withdraw(rawAmount)
      setAmount('')
    } catch (err) {
      console.error('Withdraw failed:', err)
    }
  }

  const availableBalance = parseFloat(info?.userBalance || '0')
  const withdrawAmount = parseFloat(amount || '0')
  const isInsufficient = withdrawAmount > availableBalance
  const isValid = withdrawAmount > 0 && !isInsufficient

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Withdraw USDC</CardTitle>
          <CardDescription>Connect your wallet to withdraw</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-500">Please connect your wallet to continue</p>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (txDigest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Withdraw USDC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 space-y-4"
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <h3 className="font-coolvetica text-xl font-semibold text-gray-900 mb-1">
                Withdrawal Successful!
              </h3>
              <p className="text-sm text-gray-600">
                Your USDC has been withdrawn to your wallet
              </p>
            </div>
            <div className="w-full max-w-md p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {txDigest.slice(0, 8)}...{txDigest.slice(-8)}
              </p>
            </div>
            <Button onClick={reset} variant="outline" className="mt-4">
              Make Another Withdrawal
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw USDC</CardTitle>
        <CardDescription>
          Withdraw your USDC from the vault to your wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Balance */}
        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Available to Withdraw</span>
            <Badge variant="default">{formatUSDCWithSign(info?.userBalance || '0')}</Badge>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Amount (USDC)</label>
            <button
              onClick={handleMaxClick}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              Max
            </button>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="text-2xl font-semibold pr-20"
              disabled={withdrawing}
              error={isInsufficient ? 'Insufficient balance' : undefined}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              USDC
            </div>
          </div>
        </div>

        {/* Withdrawal Preview */}
        {amount && isValid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-blue-50 p-4 border border-blue-100"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Withdraw Amount:</span>
                <span className="font-semibold text-gray-900">
                  {formatUSDCWithSign(amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Balance:</span>
                <span className="font-semibold text-gray-900">
                  {formatUSDCWithSign((availableBalance - withdrawAmount).toFixed(6))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-gray-600">Gas Fee:</span>
                <span className="font-semibold text-gray-900">~$0.01</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={!isValid || withdrawing}
          loading={withdrawing}
          size="lg"
          className="w-full"
        >
          {withdrawing ? (
            'Withdrawing...'
          ) : (
            <>
              <ArrowDownToLine className="mr-2 h-5 w-5" />
              Withdraw {amount || '0'} USDC
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}