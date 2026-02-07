'use client';

import { ReactNode } from 'react';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const suiQueryClient = new QueryClient();

const networks = {
  testnet: { 
    url: getJsonRpcFullnodeUrl('testnet'),
    network: 'testnet' as const,
  },
  mainnet: { 
    url: getJsonRpcFullnodeUrl('mainnet'),
    network: 'mainnet' as const,
  },
};

export function SuiProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={suiQueryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}