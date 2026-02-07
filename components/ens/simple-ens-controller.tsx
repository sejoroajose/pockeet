'use client'

import { useConnection } from 'wagmi'
import { useEnsName, useEnsText } from 'wagmi'
import { mainnet } from 'viem/chains'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SimpleENSController() {
  const { address } = useConnection()
  
  const { data: ensName, isLoading: nameLoading } = useEnsName({
    address,
    chainId: mainnet.id,
  })

  const { data: strategy } = useEnsText({
    name: ensName || undefined,
    key: 'com.pockeet.strategy',
    chainId: mainnet.id,
    query: { enabled: !!ensName },
  })

  const { data: autoWithdraw } = useEnsText({
    name: ensName || undefined,
    key: 'com.pockeet.auto-withdraw',
    chainId: mainnet.id,
    query: { enabled: !!ensName },
  })

  const { data: threshold } = useEnsText({
    name: ensName || undefined,
    key: 'com.pockeet.threshold',
    chainId: mainnet.id,
    query: { enabled: !!ensName },
  })

  if (!address) return null

  if (nameLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (!ensName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ENS Control</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Set an ENS name to control your vault settings
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://app.ens.domains', '_blank')}
          >
            Get ENS Name
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hasSettings = strategy || autoWithdraw || threshold

  return (
    <Card className={hasSettings ? 'border-green-200 bg-green-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">ENS Control</CardTitle>
          {hasSettings && (
            <Badge variant="success" className="text-xs">Active</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="font-semibold text-gray-900">{ensName}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-auto p-0 text-xs text-gray-600"
            onClick={() => window.open(`https://app.ens.domains/${ensName}`, '_blank')}
          >
            Manage settings <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {hasSettings ? (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            {strategy && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Strategy:</span>
                <span className="font-medium capitalize">{strategy}</span>
              </div>
            )}
            {autoWithdraw && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Auto-withdraw:</span>
                <span className="font-medium">{autoWithdraw === 'true' ? 'Enabled' : 'Disabled'}</span>
              </div>
            )}
            {threshold && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Threshold:</span>
                <span className="font-medium">${threshold}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <p className="mb-2">Configure these text records:</p>
            <div className="space-y-1 text-xs font-mono bg-gray-50 p-2 rounded">
              <div>com.pockeet.strategy</div>
              <div>com.pockeet.auto-withdraw</div>
              <div>com.pockeet.threshold</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}