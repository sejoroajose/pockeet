'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, CheckCircle2 } from 'lucide-react';

export function YieldSimulator({ vaultId }: { vaultId: string }) {
  const [simulating, setSimulating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const handleSimulate = async () => {
    setSimulating(true);
    setError(null);
    setSuccess(false);
    setTxDigest(null);

    try {
      const response = await fetch('/api/simulate-yield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTxDigest(result.txDigest);
      } else {
        setError(result.error || 'Yield simulation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSimulating(false);
    }
  };

  if (success && txDigest) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <div>
              <h3 className="font-bold text-green-900">Yield Generated!</h3>
              <p className="text-sm text-green-700 mt-1">
                5 SUI added to vault as yield
              </p>
              <a 
                href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline font-mono mt-2 inline-block"
              >
                View Transaction
              </a>
            </div>
            <Button 
              onClick={() => {
                setSuccess(false);
                setTxDigest(null);
              }} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Simulate More Yield
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          <span>Generate Yield (Demo)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Simulate yield generation by adding 5 SUI to the vault's yield balance.
        </p>

        {error && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button
          onClick={handleSimulate}
          disabled={simulating}
          className="w-full"
          variant="secondary"
        >
          {simulating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Yield...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate 5 SUI Yield
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          This simulates earning yield on deposited funds
        </p>
      </CardContent>
    </Card>
  );
}