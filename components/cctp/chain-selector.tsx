'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CCTP_CHAINS, type CCTPChainConfig } from '@/lib/arc/chains';
import { useSwitchChain } from 'wagmi';

interface ChainSelectorProps {
  selectedChain: CCTPChainConfig;
  onChainSelect: (chain: CCTPChainConfig) => void;
}

export function ChainSelector({ selectedChain, onChainSelect }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { switchChain } = useSwitchChain();

  const handleSelect = (chain: CCTPChainConfig) => {
    onChainSelect(chain);
    switchChain({ chainId: chain.chain.id });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
          <span>{selectedChain.chain.name}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <Card className="absolute z-50 mt-2 w-full p-2 max-h-80 overflow-y-auto">
          {Object.values(CCTP_CHAINS).map((chain) => (
            <button
              key={chain.chain.id}
              onClick={() => handleSelect(chain)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{chain.chain.name}</div>
                  <div className="text-xs text-gray-500">Domain {chain.domain}</div>
                </div>
              </div>
              {selectedChain.chain.id === chain.chain.id && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}