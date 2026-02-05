'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, TrendingUp, Globe, Coins, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            <span>HackMoney 2026 - Sui + LI.FI + ENS Integration</span>
          </div>

          <h1 className="font-coolvetica text-6xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
              Your Smart USDC
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
              Treasury on Sui
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Deposit from any chain, earn automated yield on Sui, withdraw anywhere.
            No bridges. No complexity. Just DeFi that works.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/deposit">
              <Button size="xl" className="w-full sm:w-auto">
                Try Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/vault">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                View Vault
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Core Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 p-2.5 mb-4">
                  <Globe className="h-full w-full text-white" />
                </div>
                <CardTitle>Cross-Chain Deposits</CardTitle>
                <CardDescription>
                  Deposit USDC from Ethereum, Base, Arbitrum, or Optimism
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Powered by <span className="font-semibold text-purple-700">LI.FI</span> bridge aggregation
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 p-2.5 mb-4">
                  <TrendingUp className="h-full w-full text-white" />
                </div>
                <CardTitle>Automated Yield</CardTitle>
                <CardDescription>
                  Earn 5-30% APY based on your risk preference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Efficient vault on <span className="font-semibold text-purple-700">Sui</span> blockchain
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-2.5 mb-4">
                  <Coins className="h-full w-full text-white" />
                </div>
                <CardTitle>ENS Integration</CardTitle>
                <CardDescription>
                  Store preferences in your ENS name
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Set yield strategy, auto-withdraw, and risk via <span className="font-semibold text-purple-700">ENS</span> text records
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Technical Stack */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-coolvetica text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
              Technical Implementation
            </span>
          </h2>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>Sui Move Contracts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✅ Dynamic field storage for gas optimization</li>
                  <li>✅ Complex PTBs for multi-step operations</li>
                  <li>✅ Event-driven architecture</li>
                  <li>✅ Comprehensive test coverage</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span>LI.FI Bridge Integration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✅ Automatic route optimization</li>
                  <li>✅ Multi-chain support (ETH, Base, Arbitrum, OP)</li>
                  <li>✅ Slippage protection</li>
                  <li>✅ Real-time status tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-emerald-600" />
                  <span>ENS Treasury Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✅ Yield strategy configuration</li>
                  <li>✅ Auto-withdrawal thresholds</li>
                  <li>✅ Risk tolerance settings</li>
                  <li>✅ Notification preferences</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-12 text-white"
        >
          <h2 className="font-coolvetica text-4xl font-bold mb-4">
            Ready to See It in Action?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Test cross-chain deposits, automated yield, and ENS integration
          </p>
          <Link href="/deposit">
            <Button size="xl" variant="secondary">
              Launch Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>Built for HackMoney 2026 | Targeting Sui, LI.FI, and ENS prizes</p>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <a href="https://github.com/pockeet" className="hover:text-purple-700">GitHub</a>
            <span>•</span>
            <a href="https://docs.pockeet.xyz" className="hover:text-purple-700">Docs</a>
            <span>•</span>
            <a href="https://twitter.com/pockeet" className="hover:text-purple-700">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  )
}