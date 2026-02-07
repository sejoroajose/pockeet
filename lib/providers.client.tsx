'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { mainnet, sepolia, base, arbitrum, optimism, polygon } from 'wagmi/chains';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://explorer.testnet.arc.network',
    },
  },
  testnet: true,
} as const;

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: 'pockeet',
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [arcTestnet, sepolia, mainnet, base, arbitrum, optimism, polygon],
    transports: {
      [arcTestnet.id]: http(),
      [sepolia.id]: http(),
      [mainnet.id]: http(),
      [base.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [polygon.id]: http(),
    },
  })
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Dynamically import Sui provider to avoid SSR issues
const SuiProviderWrapper = dynamic(
  () => import('./SuiProviderWrapper').then((mod) => mod.SuiProviderWrapper),
  { 
    ssr: false,
    loading: () => null, // Return null while loading
  }
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <ConnectKitProvider
          theme="midnight"
          mode="dark"
          options={{
            enforceSupportedChains: false,
          }}
        >
          <SuiProviderWrapper>{children}</SuiProviderWrapper>
        </ConnectKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}