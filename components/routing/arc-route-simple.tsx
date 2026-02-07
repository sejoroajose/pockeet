'use client'

import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ArcRouteProps {
  fromChain: string
  amount: string
}

export function ArcRouteDisplay({ fromChain, amount }: ArcRouteProps) {
  const steps = [
    { label: fromChain, desc: 'Source' },
    { label: 'LI.FI', desc: 'Bridge' },
    { label: 'Arc', desc: 'USDC Hub', highlight: true },
    { label: 'Sui', desc: 'Vault' },
  ]

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="text-base">Route</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className={`text-center ${step.highlight ? 'px-3 py-2 bg-purple-50 rounded-lg border border-purple-200' : ''}`}>
                <div className={`text-sm font-semibold ${step.highlight ? 'text-purple-700' : 'text-gray-900'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-gray-500">{step.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
              )}
            </div>
          ))}
        </div>
        
        {amount && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{amount} USDC</span> will route through Arc's USDC liquidity hub
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}