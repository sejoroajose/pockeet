'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative"
        >
          <div className="text-[80px] font-coolvetica font-bold gradient-text leading-none">
            404
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border-4 border-purple-200 border-t-purple-600"
          />
        </motion.div>

        {/* Message */}
        <div className="space-y-4 mt-12">
          <h1 className="font-coolvetica text-3xl font-bold text-gray-900">
            Page Not Found
          </h1>
          <p className="text-gray-600">
            Looks like this page took a wrong turn. Let's get you back on track!
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              <Search className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/deposit" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Deposit
            </Link>
            <Link href="/vault" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Vault
            </Link>
            <Link href="/yield" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Yield
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}