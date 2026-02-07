'use client';

import { useState, useEffect } from 'react';
import { useConnection } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { getChainsWithBalance, type ChainWithBalance } from '@/lib/lifi/chains-with-balance';

export function DynamicBalanceScanner() {
  const { address } = useConnection();
  const [chains, setChains] = useState<ChainWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const scanChains = async () => {
    if (!address) return;

    setLoading(true);
    const result = await getChainsWithBalance(address);
    setChains(result);
    setScanned(true);
    setLoading(false);
  };

  useEffect(() => {
    if (address && !scanned) {
      scanChains();
    }
  }, [address]);

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">USDC Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-600">Connect wallet to scan chains</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = chains.reduce((sum, c) => sum + parseFloat(c.balance), 0);
  const zkChains = chains.filter((c) => c.type === 'ZK');
  const l2Chains = chains.filter((c) => c.type === 'L2');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">USDC Scanner</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {chains.length} chains with USDC
            </p>
          </div>
          <Button onClick={scanChains} disabled={loading} variant="outline" size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
            <p className="text-sm text-gray-600">Scanning chains...</p>
          </div>
        ) : chains.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">No USDC found</p>
            <p className="text-xs text-gray-600">Get USDC from an exchange or faucet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total</p>
                <p className="text-lg font-bold text-purple-700">{total.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">ZK</p>
                <p className="text-lg font-bold text-blue-700">{zkChains.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">L2</p>
                <p className="text-lg font-bold text-green-700">{l2Chains.length}</p>
              </div>
            </div>

            <div className="space-y-2">
              {chains.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant={c.type === 'ZK' ? 'default' : 'secondary'} className="text-xs">
                      {c.type}
                    </Badge>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {parseFloat(c.balance).toFixed(2)} USDC
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}