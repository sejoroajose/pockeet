'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Zap, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '@/lib/utils/cn'

interface Strategy {
  id: 'conservative' | 'moderate' | 'aggressive'
  name: string
  description: string
  apy: string
  risk: 'Low' | 'Medium' | 'High'
  icon: typeof Shield
  color: string
  bgColor: string
  features: string[]
}

const strategies: Strategy[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Stable returns with minimal risk',
    apy: '5-8%',
    risk: 'Low',
    icon: Shield,
    color: 'text-emerald-600',
    bgColor: 'from-emerald-50 to-green-50',
    features: [
      'Blue-chip DeFi protocols',
      'Low volatility',
      'Guaranteed principal protection',
    ],
  },
  {
    id: 'moderate',
    name: 'Moderate',
    description: 'Balanced risk and reward',
    apy: '10-15%',
    risk: 'Medium',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'from-blue-50 to-purple-50',
    features: [
      'Diversified protocols',
      'Moderate volatility',
      'Smart rebalancing',
    ],
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Maximum returns with higher risk',
    apy: '20-30%',
    risk: 'High',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'from-orange-50 to-red-50',
    features: [
      'High-yield opportunities',
      'Active management',
      'Optimized for returns',
    ],
  },
]

export function YieldStrategySelector() {
  const [selected, setSelected] = useState<Strategy['id']>('moderate')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Yield Strategy</CardTitle>
        <CardDescription>
          Select a strategy that matches your risk tolerance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategies.map((strategy, index) => {
            const Icon = strategy.icon
            const isSelected = selected === strategy.id

            return (
              <motion.button
                key={strategy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelected(strategy.id)}
                className={cn(
                  'relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all duration-300',
                  isSelected
                    ? 'border-purple-500 shadow-xl shadow-purple-200'
                    : 'border-gray-200 hover:border-purple-200 hover:shadow-lg'
                )}
              >
                {/* Background Gradient */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity',
                  strategy.bgColor,
                  isSelected ? 'opacity-70' : 'opacity-30'
                )} />

                {/* Content */}
                <div className="relative space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      'h-12 w-12 rounded-xl p-2.5 shadow-md',
                      isSelected
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                        : 'bg-white'
                    )}>
                      <Icon className={cn(
                        'h-full w-full',
                        isSelected ? 'text-white' : strategy.color
                      )} />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center"
                      >
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Title & APY */}
                  <div>
                    <h3 className="font-coolvetica text-xl font-bold text-gray-900 mb-1">
                      {strategy.name}
                    </h3>
                    <p className="text-sm text-gray-600">{strategy.description}</p>
                  </div>

                  {/* APY Badge */}
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      strategy.risk === 'Low' ? 'success' :
                      strategy.risk === 'Medium' ? 'default' :
                      'warning'
                    }>
                      {strategy.risk} Risk
                    </Badge>
                    <span className="text-2xl font-bold text-purple-700">
                      {strategy.apy}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    {strategy.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Selected Strategy Info */}
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100"
        >
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Selected: </span>
            {strategies.find(s => s.id === selected)?.name} strategy with{' '}
            <span className="font-semibold text-purple-700">
              {strategies.find(s => s.id === selected)?.apy} APY
            </span>
          </p>
        </motion.div>
      </CardContent>
    </Card>
  )
}