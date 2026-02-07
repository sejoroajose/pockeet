'use client';

import { ArrowRight, Zap, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CCTPRouteDisplayProps {
  amount: string;
}

export function CCTPRouteDisplay({ amount }: CCTPRouteDisplayProps) {
  const steps = [
    {
      id: 'arc',
      label: 'Arc Network',
      icon: '⚡',
      description: 'USDC Source',
      highlight: false,
    },
    {
      id: 'cctp',
      label: 'Circle CCTP',
      icon: '🔄',
      description: 'Native Bridge',
      highlight: true,
    },
    {
      id: 'sui',
      label: 'Sui Vault',
      icon: '💎',
      description: 'Earn Yield',
      highlight: false,
    },
  ];

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <span>Direct CCTP Route</span>
          <Badge variant="success" className="ml-auto">
            Native USDC
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Route Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div
                className={`flex items-center space-x-4 p-3 rounded-xl transition-all ${
                  step.highlight
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-400'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-2xl ${
                  step.highlight ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gray-100'
                }`}>
                  {step.highlight ? <span className="text-white">🔄</span> : <span>{step.icon}</span>}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className={`font-semibold ${step.highlight ? 'text-purple-900' : 'text-gray-900'}`}>
                      {step.label}
                    </p>
                    {step.highlight && (
                      <Badge variant="default" className="text-xs">Circle CCTP</Badge>
                    )}
                  </div>
                  <p className={`text-sm ${step.highlight ? 'text-purple-700' : 'text-gray-600'}`}>
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-purple-200">
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Time</p>
            <p className="font-semibold text-blue-700">~15 min</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <Zap className="h-4 w-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Fee</p>
            <p className="font-semibold text-purple-700">~$0.10</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50">
            <Shield className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Security</p>
            <p className="font-semibold text-emerald-700">CCTP</p>
          </div>
        </div>

        {/* Why This Route */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h4 className="font-semibold mb-2 flex items-center space-x-2">
            <span>✨</span>
            <span>Why Circle CCTP?</span>
          </h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center space-x-2">
              <span className="text-purple-200">→</span>
              <span>Native USDC - no wrapped tokens</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-purple-200">→</span>
              <span>Instant finality from Arc to Sui</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-purple-200">→</span>
              <span>Lowest fees with direct protocol integration</span>
            </li>
          </ul>
        </div>

        {amount && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{amount} USDC</span> will be bridged natively via Circle CCTP
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}