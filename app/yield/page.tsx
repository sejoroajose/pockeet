'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConnection } from 'wagmi'
import { motion } from 'framer-motion'
import { TrendingUp, Info, Shield, Zap, BarChart3 } from 'lucide-react'
import { YieldStrategySelector } from '@/components/yield/yield-strategy-selector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loading'

const protocols = [
  {
    name: 'Navi Protocol',
    tvl: '$45M',
    apy: '12.5%',
    risk: 'Medium',
    description: 'Leading lending protocol on Sui',
    logo: '🏦',
  },
  {
    name: 'Cetus',
    tvl: '$28M',
    apy: '15.2%',
    risk: 'Medium',
    description: 'Concentrated liquidity DEX',
    logo: '🐋',
  },
  {
    name: 'Turbos Finance',
    tvl: '$18M',
    apy: '10.8%',
    risk: 'Low',
    description: 'Stable swap protocol',
    logo: '⚡',
  },
  {
    name: 'Scallop',
    tvl: '$12M',
    apy: '8.5%',
    risk: 'Low',
    description: 'Money market protocol',
    logo: '🏛️',
  },
]

const riskLevels = [
  {
    level: 'Conservative',
    risk: 'Low',
    apy: '5-8%',
    description: 'Focus on stability and capital preservation',
    features: [
      'Blue-chip protocols only',
      'Lower volatility',
      'Guaranteed principal protection',
      'Automated rebalancing',
    ],
    color: 'from-emerald-500 to-green-500',
  },
  {
    level: 'Moderate',
    risk: 'Medium',
    apy: '10-15%',
    description: 'Balanced approach to risk and reward',
    features: [
      'Diversified protocol exposure',
      'Moderate volatility',
      'Smart risk management',
      'Optimized yield strategies',
    ],
    color: 'from-blue-500 to-purple-500',
  },
  {
    level: 'Aggressive',
    risk: 'High',
    apy: '20-30%',
    description: 'Maximum returns with active management',
    features: [
      'High-yield opportunities',
      'Higher volatility',
      'Active position management',
      'Advanced DeFi strategies',
    ],
    color: 'from-orange-500 to-red-500',
  },
]

export default function YieldPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <h1 className="font-coolvetica text-4xl font-bold gradient-text">
              Yield Strategies
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Choose a strategy that matches your risk tolerance and maximize your returns
          </p>
        </motion.div>

        {/* Strategy Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <YieldStrategySelector />
        </motion.div>

        {/* Risk Levels Deep Dive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-coolvetica text-2xl font-bold text-gray-900 mb-6">
            Understanding Risk Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {riskLevels.map((item, index) => (
              <Card key={item.level} className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl">{item.level}</CardTitle>
                    <Badge variant={
                      item.risk === 'Low' ? 'success' :
                      item.risk === 'Medium' ? 'default' :
                      'warning'
                    }>
                      {item.risk} Risk
                    </Badge>
                  </div>
                  <div className="text-3xl font-coolvetica font-bold text-purple-700">
                    {item.apy}
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start space-x-2 text-sm">
                        <Shield className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Active Protocols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="font-coolvetica text-2xl font-bold text-gray-900 mb-6">
            Supported Protocols
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {protocols.map((protocol) => (
              <Card key={protocol.name} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{protocol.logo}</div>
                      <div>
                        <CardTitle>{protocol.name}</CardTitle>
                        <CardDescription>{protocol.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">TVL</p>
                      <p className="text-lg font-bold text-gray-900">{protocol.tvl}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">APY</p>
                      <p className="text-lg font-bold text-emerald-700">{protocol.apy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Risk</p>
                      <Badge variant={
                        protocol.risk === 'Low' ? 'success' :
                        protocol.risk === 'Medium' ? 'default' :
                        'warning'
                      }>
                        {protocol.risk}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>How Yield Strategies Work</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xl font-coolvetica font-bold mx-auto mb-3 flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Auto-Deploy</h3>
                  <p className="text-sm text-gray-600">
                    Your funds are automatically deployed to vetted DeFi protocols
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xl font-coolvetica font-bold mx-auto mb-3 flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Earn Yield</h3>
                  <p className="text-sm text-gray-600">
                    Accrue interest and rewards from lending, liquidity provision, and more
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xl font-coolvetica font-bold mx-auto mb-3 flex items-center justify-center">
                    3
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Auto-Compound</h3>
                  <p className="text-sm text-gray-600">
                    Rewards are automatically reinvested to maximize returns
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-200 flex items-start space-x-3">
                <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Smart Risk Management</p>
                  <p>
                    Our strategies use automated rebalancing and risk monitoring to protect your capital while maximizing returns. Positions are diversified across multiple protocols to minimize protocol-specific risks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}