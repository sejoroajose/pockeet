'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={cn('text-purple-600', sizeMap[size])}
      >
        <Loader2 className="h-full w-full" />
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="inline-block"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-2xl font-coolvetica font-bold text-white">p</span>
          </div>
        </motion.div>
        <p className="text-gray-600 font-medium">Loading pockeet...</p>
      </div>
    </div>
  )
}

export function CardLoader() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="space-y-3">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  )
}