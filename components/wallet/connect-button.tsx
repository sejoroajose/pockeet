'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConnection, useDisconnect } from 'wagmi'
import { useConnectModal } from '@mysten/dapp-kit'
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils/cn'
import { shortenAddress } from '@/lib/utils/formatters'
import { Badge } from '../ui/badge'

export function ConnectButton() {
  const { address, isConnected } = useConnection()
  const disconnect = useDisconnect()
  const { open } = useConnectModal()
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setShowMenu(false)
  }

  if (!isConnected) {
    return (
      <Button
        onClick={() => open()}
        size="default"
        className="shadow-lg"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-3 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 p-1.5 shadow-sm">
            <Wallet className="h-full w-full text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-500 font-medium">Connected</span>
            <span className="text-sm font-semibold text-gray-900">
              {shortenAddress(address)}
            </span>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-500 transition-transform duration-200",
          showMenu && "rotate-180"
        )} />
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl z-50"
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Wallet Address</span>
                <Badge variant="success" className="text-xs">Connected</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono text-gray-900">
                  {shortenAddress(address, 6)}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                className="flex items-center w-full space-x-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View on Explorer</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center w-full space-x-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}