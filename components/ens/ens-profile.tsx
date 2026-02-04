'use client'

import { motion } from 'framer-motion'
import { User, Mail, Settings, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useENS, useTreasurySettings } from '@/lib/ens/hooks'
import { shortenAddress } from '@/lib/utils/formatters'
import type { Address } from 'viem'

interface ENSProfileProps {
  address?: Address
}

export function ENSProfile({ address }: ENSProfileProps) {
  const { ensName, avatar, loading: ensLoading } = useENS(address)
  const { settings, hasTreasury, loading: settingsLoading } = useTreasurySettings(ensName || undefined)

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ENS Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          Connect wallet to view profile
        </CardContent>
      </Card>
    )
  }

  if (ensLoading || settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ENS Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile</CardTitle>
          {hasTreasury && (
            <Badge variant="success">Treasury Configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          {avatar ? (
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={avatar}
              alt={ensName || 'Profile'}
              className="h-20 w-20 rounded-full border-4 border-purple-100 shadow-lg mb-4"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-4 shadow-lg">
              <User className="h-10 w-10 text-purple-600" />
            </div>
          )}

          {ensName ? (
            <div>
              <h3 className="font-coolvetica text-2xl font-bold text-gray-900 mb-1">
                {ensName}
              </h3>
              <p className="text-sm text-gray-500 font-mono">
                {shortenAddress(address, 6)}
              </p>
            </div>
          ) : (
            <div>
              <h3 className="font-mono text-lg font-semibold text-gray-900 mb-1">
                {shortenAddress(address, 8)}
              </h3>
              <p className="text-sm text-gray-500">No ENS name</p>
            </div>
          )}
        </div>

        {/* Treasury Settings */}
        {hasTreasury && settings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100"
          >
            <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Settings className="h-4 w-4 text-purple-600" />
              <span>Treasury Settings</span>
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Strategy:</span>
                <Badge variant="default">{settings.yieldStrategy}</Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Risk Level:</span>
                <Badge variant={
                  settings.riskTolerance === 'low' ? 'success' :
                  settings.riskTolerance === 'medium' ? 'default' :
                  'warning'
                }>
                  {settings.riskTolerance}
                </Badge>
              </div>

              {settings.autoWithdraw && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto-withdraw:</span>
                  <span className="font-medium text-gray-900">
                    ${settings.withdrawThreshold}
                  </span>
                </div>
              )}

              {settings.email && (
                <div className="flex items-center space-x-2 pt-2 border-t border-purple-200">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{settings.email}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {ensName && (
            <button
              onClick={() => window.open(`https://app.ens.domains/${ensName}`, '_blank')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <span className="text-sm font-medium">View ENS Profile</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          )}

          {!hasTreasury && ensName && (
            <button
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Configure Treasury</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}