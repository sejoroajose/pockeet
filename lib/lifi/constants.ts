import { ChainId } from '@lifi/sdk';

/**
 * Supported chains for CrossVault
 */
export const SUPPORTED_CHAINS = {
  ETHEREUM: ChainId.ETH,
  ARBITRUM: ChainId.ARB,
  OPTIMISM: ChainId.OPT,
  POLYGON: ChainId.POL,
  BASE: ChainId.BAS,
  ARC: 5042002, // Arc testnet chain ID
} as const;

/**
 * Chain metadata
 */
export const CHAIN_METADATA = {
  [ChainId.ETH]: {
    name: 'Ethereum',
    shortName: 'ETH',
    logo: '/images/chains/ethereum.svg',
    color: '#627EEA',
  },
  [ChainId.ARB]: {
    name: 'Arbitrum',
    shortName: 'ARB',
    logo: '/images/chains/arbitrum.svg',
    color: '#28A0F0',
  },
  [ChainId.OPT]: {
    name: 'Optimism',
    shortName: 'OP',
    logo: '/images/chains/optimism.svg',
    color: '#FF0420',
  },
  [ChainId.POL]: {
    name: 'Polygon',
    shortName: 'MATIC',
    logo: '/images/chains/polygon.svg',
    color: '#8247E5',
  },
  [ChainId.BAS]: {
    name: 'Base',
    shortName: 'BASE',
    logo: '/images/chains/base.svg',
    color: '#0052FF',
  },
  [SUPPORTED_CHAINS.ARC]: {
    name: 'Arc',
    shortName: 'ARC',
    logo: '/images/chains/arc.svg',
    color: '#9333EA',
  },
} as const;

/**
 * USDC token addresses on each chain
 */
export const USDC_ADDRESSES = {
  [ChainId.ETH]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [ChainId.ARB]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [ChainId.OPT]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  [ChainId.POL]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  [ChainId.BAS]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [SUPPORTED_CHAINS.ARC]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
} as const;

/**
 * Get USDC address for a chain
 */
export function getUSDCAddress(chainId: number): string {
  return USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES] || '';
}

/**
 * Get chain metadata
 */
export function getChainMetadata(chainId: number) {
  return CHAIN_METADATA[chainId as keyof typeof CHAIN_METADATA] || {
    name: 'Unknown Chain',
    shortName: '?',
    logo: '',
    color: '#666666',
  };
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in USDC_ADDRESSES;
}

/**
 * Get list of supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.values(SUPPORTED_CHAINS);
}

/**
 * Default slippage tolerance (0.5%)
 */
export const DEFAULT_SLIPPAGE = 0.005;

/**
 * Maximum slippage tolerance (5%)
 */
export const MAX_SLIPPAGE = 0.05;

/**
 * Route refresh interval (30 seconds)
 */
export const ROUTE_REFRESH_INTERVAL = 30000;

/**
 * Status polling interval (10 seconds)
 */
export const STATUS_POLL_INTERVAL = 10000;

/**
 * Minimum USDC amount for bridging
 */
export const MIN_BRIDGE_AMOUNT = '1.00'; // $1 USDC

/**
 * Maximum USDC amount for bridging (no protocol limit, but for UI validation)
 */
export const MAX_BRIDGE_AMOUNT = '1000000.00'; // $1M USDC