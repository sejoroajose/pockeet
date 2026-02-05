'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { 
  ArrowRight, 
  Wallet, 
  TrendingUp, 
  Shield, 
  Zap,
  Globe,
  Lock,
  BarChart3,
  Users,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Wallet,
    title: 'Multi-Chain Deposits',
    description: 'Deposit USDC from Ethereum, Base, Arbitrum, Optimism, and more',
    color: 'from-purple-500 to-blue-500',
  },
  {
    icon: TrendingUp,
    title: 'Auto-Compounding Yield',
    description: 'Earn competitive APY with automated yield strategies',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: Shield,
    title: 'Battle-Tested Security',
    description: 'Built on Sui blockchain with audited smart contracts',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Instant Withdrawals',
    description: 'Access your funds anytime with no lock-up periods',
    color: 'from-orange-500 to-red-500',
  },
]

const stats = [
  { label: 'Total Value Locked', value: '$1.2M+', icon: BarChart3 },
  { label: 'Active Users', value: '2,847', icon: Users },
  { label: 'Average APY', value: '12.4%', icon: TrendingUp },
  { label: 'Supported Chains', value: '6+', icon: Globe },
]

const benefits = [
  'No minimum deposit required',
  'Withdraw anytime, no penalties',
  'Transparent, on-chain accounting',
  'Auto-compounding rewards',
  'ENS integration for easy management',
  'Cross-chain compatibility',
]

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll('.hero-animate'),
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.15,
          ease: 'power3.out'
        }
      )
    }
  }, [])

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-white" />
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(147,51,234,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]"
        />

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="hero-animate mb-6" variant="default">
                <Zap className="h-3 w-3 mr-1" />
                Now Live on Sui Testnet
              </Badge>
            </motion.div>

            <h1 className="hero-animate font-coolvetica text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="gradient-text">Your Smart</span>
              <br />
              <span className="gradient-text">USDC Treasury</span>
            </h1>

            <p className="hero-animate text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
              Deposit from anywhere, earn everywhere. The easiest way to manage and grow your USDC across multiple chains.
            </p>

            <div className="hero-animate flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/deposit">
                <Button size="xl" className="group">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="xl" variant="outline">
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 mb-3">
                      <Icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-2xl md:text-3xl font-coolvetica font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="h-8 w-5 rounded-full border-2 border-purple-300 flex items-start justify-center p-1">
            <div className="h-1.5 w-1.5 bg-purple-600 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-coolvetica text-4xl md:text-5xl font-bold gradient-text mb-4">
              Why Choose pockeet?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The most advanced USDC treasury management platform built for the multi-chain future
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full card-hover">
                    <CardHeader>
                      <div className={`inline-flex h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 shadow-lg`}>
                        <Icon className="h-full w-full text-white" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-coolvetica text-4xl md:text-5xl font-bold gradient-text mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Connect Wallet', desc: 'Link your wallet from any supported chain' },
              { step: '2', title: 'Deposit USDC', desc: 'Bridge and deposit USDC from anywhere' },
              { step: '3', title: 'Earn Yield', desc: 'Watch your balance grow automatically' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white text-2xl font-coolvetica font-bold mb-4 shadow-xl shadow-purple-500/30">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-coolvetica font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-blue-300 -z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-coolvetica text-4xl md:text-5xl font-bold gradient-text mb-4">
                Built for DeFi Power Users
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to maximize your USDC yield
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-3 p-4 rounded-xl hover:bg-purple-50 transition-colors"
                >
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center text-white space-y-8"
          >
            <h2 className="font-coolvetica text-4xl md:text-5xl font-bold">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-purple-100">
              Join thousands of users already growing their USDC with pockeet
            </p>
            <Link href="/deposit">
              <Button size="xl" variant="secondary" className="group">
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}