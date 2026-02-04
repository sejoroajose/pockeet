'use client'

import { motion } from 'framer-motion'
import { DollarSign, Users, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { useTVL } from '@/lib/sui/hooks'
import { formatUSDCWithSign } from '@/lib/utils/formatters'

interface StatsCardsProps {
  vaultId?: string
}

const stats = [
  {
    icon: DollarSign,
    label: 'Total Value Locked',
    value: '$1,234,567',
    change: '+12.5%',
    color: 'from-purple-500 to-blue-500',
    bgColor: 'from-purple-50 to-blue-50',
  },
  {
    icon: Users,
    label: 'Active Users',
    value: '2,847',
    change: '+8.2%',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'from-emerald-50 to-green-50',
  },
  {
    icon: TrendingUp,
    label: 'Average APY',
    value: '12.4%',
    change: '+2.1%',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
  },
  {
    icon: Activity,
    label: '24h Volume',
    value: '$456,789',
    change: '+15.3%',
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-50 to-red-50',
  },
]

export function StatsCards({ vaultId }: StatsCardsProps) {
  const { tvl, loading } = useTVL(vaultId)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const displayValue = index === 0 && tvl !== '0.00' 
          ? formatUSDCWithSign(tvl) 
          : stat.value

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50`} />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} p-2.5 shadow-lg`}>
                    <Icon className="h-full w-full text-white" />
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-coolvetica font-bold text-gray-900">
                  {loading && index === 0 ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    displayValue
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}