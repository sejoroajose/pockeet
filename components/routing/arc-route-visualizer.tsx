'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface ArcRouteVisualizerProps {
  fromChain: string;
  amount: string;
  estimatedTime: number; // in minutes
  fees: {
    lifi: string;
    arc: string;
    total: string;
  };
}

export function ArcRouteVisualizer({
  fromChain,
  amount,
  estimatedTime,
  fees,
}: ArcRouteVisualizerProps) {
  const steps = [
    {
      id: 'source',
      label: fromChain,
      icon: '🌐',
      description: `${amount} USDC`,
      status: 'ready',
    },
    {
      id: 'lifi',
      label: 'LI.FI Bridge',
      icon: '🌉',
      description: 'Best route selected',
      status: 'pending',
    },
    {
      id: 'arc',
      label: 'Arc Hub',
      icon: '⚡',
      description: 'USDC liquidity hub',
      status: 'pending',
      highlight: true,
    },
    {
      id: 'cctp',
      label: 'Circle CCTP',
      icon: '🔄',
      description: 'Native USDC mint',
      status: 'pending',
    },
    {
      id: 'sui',
      label: 'Sui Vault',
      icon: '💎',
      description: 'Start earning yield',
      status: 'pending',
    },
  ];

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <span>Route via Arc Network</span>
          <Badge variant="success" className="ml-auto">
            Optimized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Route Steps */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-300 to-blue-300" />

          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div
                  className={`flex items-center space-x-4 p-3 rounded-xl transition-all ${
                    step.highlight
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-400 shadow-lg'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`relative z-10 h-10 w-10 rounded-lg flex items-center justify-center text-2xl ${
                      step.highlight
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg'
                        : 'bg-gray-100'
                    }`}
                  >
                    {step.highlight ? (
                      <span className="text-white">⚡</span>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p
                        className={`font-semibold ${
                          step.highlight ? 'text-purple-900' : 'text-gray-900'
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.highlight && (
                        <Badge variant="default" className="text-xs">
                          USDC Hub
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        step.highlight ? 'text-purple-700' : 'text-gray-600'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Arc Highlight Box */}
                {step.highlight && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 ml-14 p-3 rounded-lg bg-purple-50 border border-purple-200"
                  >
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-gray-600 mb-1">Fee</p>
                        <p className="font-semibold text-purple-700">${fees.arc}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Speed</p>
                        <p className="font-semibold text-purple-700">Instant</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Type</p>
                        <p className="font-semibold text-purple-700">Native USDC</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-purple-200">
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Est. Time</p>
            <p className="font-semibold text-blue-700">~{estimatedTime} min</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <Zap className="h-4 w-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Total Fee</p>
            <p className="font-semibold text-purple-700">${fees.total}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50">
            <Shield className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Security</p>
            <p className="font-semibold text-emerald-700">CCTP</p>
          </div>
        </div>

        {/* Why Arc */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h4 className="font-semibold mb-2 flex items-center space-x-2">
            <span>✨</span>
            <span>Why Arc Network?</span>
          </h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center space-x-2">
              <span className="text-purple-200">→</span>
              <span>Native USDC - no wrapped tokens</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-purple-200">→</span>
              <span>Circle CCTP for secure cross-chain transfers</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-purple-200">→</span>
              <span>Instant finality - funds move in seconds</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-purple-200">→</span>
              <span>Lowest fees as USDC liquidity hub</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}