import { createConfig, http } from 'wagmi';
import { sepolia, baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy, avalancheFuji } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [sepolia, baseSepolia, arbitrumSepolia, optimismSepolia, polygonAmoy, avalancheFuji],
  connectors: [
    injected(),
    walletConnect({ 
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID' 
    }),
  ],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-public.nodies.app'),
    [baseSepolia.id]: http('https://base-sepolia-rpc.publicnode.com'),
    [arbitrumSepolia.id]: http('https://arbitrum-sepolia-rpc.publicnode.com'),
    [optimismSepolia.id]: http('https://optimism-sepolia-public.nodies.app'),
    [polygonAmoy.id]: http('https://polygon-amoy.gateway.tenderly.co'),
    [avalancheFuji.id]: http('https://avalanche-fuji.drpc.org'),
  },
});