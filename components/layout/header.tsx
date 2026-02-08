'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Wallet, LayoutDashboard, ArrowDownUp, TrendingUp } from 'lucide-react'
import { useConnection } from 'wagmi'
import { cn } from '@/lib/utils/cn'
import { ConnectButton } from '../wallet/connect-button'
import { ENSDisplay } from '@/components/ens/ens-display'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/deposit', label: 'Deposit', icon: ArrowDownUp },
  { href: '/vault', label: 'Vault', icon: Wallet },
  /* { href: '/yield', label: 'Yield', icon: TrendingUp }, */
]

export function Header() {
  const pathname = usePathname()
  const { address, isConnected } = useConnection() 

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60"
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 p-2 shadow-lg shadow-purple-500/30">
            <Wallet className="h-full w-full text-white" />
          </div>
          <span className="font-coolvetica text-2xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
            pockeet
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-purple-700'
                    : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-100 to-blue-100 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Connect Wallet Button + ENS Display */}
        <div className="flex items-center space-x-4">
          {isConnected && address ? (
            <ENSDisplay address={address} />
          ) : (
            <ConnectButton />
          )}
        </div>
      </nav>
    </motion.header>
  )
}