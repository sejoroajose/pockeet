'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConnection } from 'wagmi'
import { motion } from 'framer-motion'
import { ArrowUpRight, Info, Shield, Zap } from 'lucide-react'
import { DepositForm } from '@/components/deposit/deposit-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loading'

const supportedChains = [
  { name: 'Ethereum', fee: '$5-20', time: '15-20 min' },
  { name: 'Base', fee: '$0.10-0.50', time: '2-5 min' },
  { name: 'Arbitrum', fee: '$0.50-2', time: '10-15 min' },
  { name: 'Optimism', fee: '$0.50-2', time: '10-15 min' },
  { name: 'Polygon', fee: '$0.10-0.50', time: '5-10 min' },
]

const features = [
  {
    icon: Zap,
    title: 'Best Routes',
    description: 'Automatically find the cheapest and fastest bridge route',
  },
  {
    icon: Shield,
    title: 'Secure Bridging',
    description: 'Battle-tested bridges with billions in TVL',
  },
  {
    icon: Info,
    title: 'Transparent Fees',
    description: 'See all costs upfront with no hidden fees',
  },
]

export default function DepositPage() {
  const { isConnected } = useConnection()
  const router = useRouter()

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
            Bridge your USDC from any supported chain to start earning yield
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DepositForm />
            </motion.div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Why Deposit?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {features.map((feature) => {
                    const Icon = feature.icon
                    return (
                      <div key={feature.title} className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Supported Chains */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Supported Chains</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supportedChains.map((chain) => (
                      <div
                        key={chain.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{chain.name}</span>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs mb-1">
                            {chain.fee}
                          </Badge>
                          <p className="text-xs text-gray-500">{chain.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm space-y-2">
                      <p className="text-gray-700">
                        <strong>Gas fees vary</strong> based on network congestion. We'll show you the exact cost before you confirm.
                      </p>
                      <p className="text-gray-700">
                        <strong>Bridge time</strong> depends on network speed and bridge type. Most deposits complete within 15 minutes.
                      </p>
                      <p className="text-gray-700">
                        <strong>Start earning</strong> immediately after your deposit is confirmed on Sui.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Note */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900 mb-1">Secure & Audited</p>
                      <p className="text-gray-700">
                        All bridge routes are through battle-tested protocols with billions in TVL and multiple security audits.
                      </p>
                    </div>
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