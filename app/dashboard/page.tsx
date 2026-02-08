'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConnection } from 'wagmi'
import Link from 'next/link'
import { ArrowUpRight, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VaultBalance } from '@/components/vault/vault-balance'
import { TransactionHistory } from '@/components/vault/transaction-history'
import { SimpleENSController } from '@/components/ens/simple-ens-controller'
import { SUI_CONFIG } from '@/lib/utils/constants'

export default function DashboardPage() {
  const { address, isConnected, isConnecting } = useConnection()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're sure they're not connected (not still connecting)
    if (!isConnecting && !isConnected) {
      router.push('/')
    }
  }, [isConnected, isConnecting, router])

  // Show loading while checking connection
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show message if not connected (before redirect happens)
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please connect your wallet</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Rest of your dashboard code */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your USDC vault</p>
        </div>
        <div className="flex gap-3">
          <Link href="/deposit">
            <Button>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Deposit
            </Button>
          </Link>
          <Link href="/vault">
            <Button variant="outline">
              <Wallet className="mr-2 h-4 w-4" />
              Vault
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VaultBalance vaultId={SUI_CONFIG.VAULT_OBJECT_ID} />
          <TransactionHistory vaultId={SUI_CONFIG.VAULT_OBJECT_ID} limit={5} />
        </div>

        <div className="space-y-6">
          <SimpleENSController />
        </div>
      </div>
    </div>
  )
}