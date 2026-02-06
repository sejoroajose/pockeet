'use client';

import { useState, useEffect } from 'react';
import { useConnection, useBalance } from 'wagmi';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatUSDCWithSign } from '@/lib/utils/formatters';
import { SUPPORTED_CHAINS, getChainMetadata, getUSDCAddress } from '@/lib/lifi/constants';

interface ChainBalance {
  chainId: number;
  chainName: string;
  balance: string;
  usdValue: string;
  canDeposit: boolean;
}

export function MultiChainBalanceDetector() {
  const { address, isConnected } = useConnection();
  const [balances, setBalances] = useState<ChainBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUSDC, setTotalUSDC] = useState('0.00');

  useEffect(() => {
    if (!address) {
      setBalances([]);
      setLoading(false);
      return;
    }

    async function detectBalances() {
      setLoading(true);
      const detected: ChainBalance[] = [];
      let total = 0;

      // Check all supported chains
      const chains = [
        { id: 1, name: 'Ethereum' },
        { id: 8453, name: 'Base' },
        { id: 42161, name: 'Arbitrum' },
        { id: 10, name: 'Optimism' },
        { id: 137, name: 'Polygon' },
        { id: 324, name: 'zkSync Era' },
        { id: 59144, name: 'Linea' },
        { id: 534352, name: 'Scroll' },
        { id: 5000, name: 'Mantle' },
      ];

      for (const chain of chains) {
        try {
          // In production, use multicall or dedicated balance API
          // For now, simulate balance detection
          const mockBalance = Math.random() > 0.7 ? (Math.random() * 1000).toFixed(2) : '0.00';
          const hasBalance = parseFloat(mockBalance) > 0;

          if (hasBalance) {
            detected.push({
              chainId: chain.id,
              chainName: chain.name,
              balance: mockBalance,
              usdValue: mockBalance,
              canDeposit: true,
            });
            total += parseFloat(mockBalance);
          }
        } catch (error) {
          console.error(`Failed to fetch balance for ${chain.name}:`, error);
        }
      }

      setBalances(detected.sort((a, b) => parseFloat(b.usdValue) - parseFloat(a.usdValue)));
      setTotalUSDC(total.toFixed(2));
      setLoading(false);
    }

    detectBalances();
  }, [address]);

  if (!isConnected) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span>Detecting USDC across chains...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (balances.length === 0) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span>No USDC Detected</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            We couldn't find USDC on any supported chains. Get some USDC to start earning yield!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span>Your USDC Detected</span>
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Available</p>
            <p className="text-2xl font-coolvetica font-bold text-purple-700">
              {formatUSDCWithSign(totalUSDC)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {balances.map((chain, index) => (
          <motion.div
            key={chain.chainId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                {chain.chainName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{chain.chainName}</p>
                <p className="text-sm text-gray-600">
                  {formatUSDCWithSign(chain.balance)} USDC
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="success" className="text-xs">
                Available
              </Badge>
              <Button
                size="sm"
                className="group-hover:scale-105 transition-transform"
                onClick={() => {
                  // Trigger deposit from this chain
                  window.location.href = `/deposit?chain=${chain.chainId}`;
                }}
              >
                Deposit
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}

        <div className="pt-4 border-t border-purple-200">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50">
            <div>
              <p className="text-sm text-gray-600 mb-1">Potential Yearly Earnings</p>
              <p className="text-xl font-coolvetica font-bold text-emerald-700">
                {formatUSDCWithSign((parseFloat(totalUSDC) * 0.12).toFixed(2))}
              </p>
              <p className="text-xs text-gray-500">at 12% APY (Moderate strategy)</p>
            </div>
            <Button size="lg" className="shadow-lg">
              Deposit All
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}