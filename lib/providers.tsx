'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { mainnet, sepolia, base, arbitrum, optimism, polygon } from 'wagmi/chains';
import { createDAppKit, DAppKitProvider } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';

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

const dAppKit = createDAppKit({
  networks: ['testnet', 'mainnet'],
  defaultNetwork: 'testnet',
  createClient(network) {
    return new SuiGrpcClient({
      network,
      baseUrl:
        network === 'mainnet'
          ? 'https://fullnode.mainnet.sui.io:443'
          : 'https://fullnode.testnet.sui.io:443',
    });
  },
});

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});


export function Providers({ children }: { children: React.ReactNode }) {
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
          <DAppKitProvider dAppKit={dAppKit}>
            {children}
          </DAppKitProvider>
        </ConnectKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}