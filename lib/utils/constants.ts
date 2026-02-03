/**
 * Application Constants
 */

export const APP_NAME = 'pockeet';
export const APP_DESCRIPTION = 'Your Smart USDC Treasury - Deposit from Anywhere, Earn Everywhere';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pockeet.xyz';

/**
 * Network Constants
 */
export const NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  DEVNET: 'devnet',
  LOCALNET: 'localnet',
} as const;

export const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_NETWORK || NETWORKS.TESTNET;

/**
 * Chain IDs
 */
export const CHAIN_IDS = {
  ETHEREUM: 1,
  SEPOLIA: 11155111,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  BASE: 8453,
  ARC_TESTNET: 5042002,
} as const;

/**
 * Sui Configuration
 */
export const SUI_CONFIG = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID!,
  VAULT_OBJECT_ID: process.env.NEXT_PUBLIC_VAULT_OBJECT_ID!,
  NETWORK: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'mainnet' | 'testnet' | 'devnet',
  RPC_URL: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
} as const;

/**
 * Arc Configuration
 */
export const ARC_CONFIG = {
  CHAIN_ID: CHAIN_IDS.ARC_TESTNET,
  RPC_URL: process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network',
  USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  TOKEN_MESSENGER: process.env.NEXT_PUBLIC_ARC_TOKEN_MESSENGER || '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
  MESSAGE_TRANSMITTER: process.env.NEXT_PUBLIC_ARC_MESSAGE_TRANSMITTER || '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
} as const;

/**
 * USDC Configuration
 */
export const USDC_DECIMALS = 6;
export const USDC_SYMBOL = 'USDC';
export const USDC_NAME = 'USD Coin';

/**
 * Transaction Limits
 */
export const MIN_DEPOSIT_AMOUNT = '1.00'; // $1 USDC
export const MAX_DEPOSIT_AMOUNT = '1000000.00'; // $1M USDC
export const MIN_WITHDRAW_AMOUNT = '1.00'; // $1 USDC

/**
 * Fee Configuration
 */
export const DEFAULT_SLIPPAGE = 0.005; // 0.5%
export const MAX_SLIPPAGE = 0.05; // 5%
export const PROTOCOL_FEE = 0; // No protocol fee

/**
 * Timing Constants (in milliseconds)
 */
export const POLLING_INTERVALS = {
  BALANCE: 30000, // 30 seconds
  TRANSACTIONS: 60000, // 1 minute
  BRIDGE_STATUS: 10000, // 10 seconds
  ROUTE: 30000, // 30 seconds
} as const;

export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  TRANSACTION: 300000, // 5 minutes
  BRIDGE: 1200000, // 20 minutes
} as const;

/**
 * UI Constants
 */
export const ITEMS_PER_PAGE = 20;
export const MAX_RECENT_TRANSACTIONS = 50;
export const DEBOUNCE_DELAY = 500; // ms

/**
 * Yield Strategy Constants
 */
export const YIELD_STRATEGIES = {
  CONSERVATIVE: {
    name: 'Conservative',
    description: 'Low risk, stable returns',
    targetAPY: 5,
    risk: 'low' as const,
  },
  MODERATE: {
    name: 'Moderate',
    description: 'Balanced risk and returns',
    targetAPY: 10,
    risk: 'medium' as const,
  },
  AGGRESSIVE: {
    name: 'Aggressive',
    description: 'Higher risk, higher potential returns',
    targetAPY: 20,
    risk: 'high' as const,
  },
} as const;

/**
 * External URLs
 */
export const EXTERNAL_URLS = {
  DOCS: 'https://docs.pockeet.xyz',
  GITHUB: 'https://github.com/pockeet',
  TWITTER: 'https://twitter.com/pockeet',
  DISCORD: 'https://discord.gg/pockeet',
  SUI_EXPLORER: 'https://suiscan.xyz/testnet',
  ARC_EXPLORER: 'https://explorer.testnet.arc.network',
  CIRCLE_DOCS: 'https://developers.circle.com/stablecoins/docs/cctp-getting-started',
  LIFI_DOCS: 'https://docs.li.fi/',
  ENS_DOCS: 'https://docs.ens.domains/',
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  THEME: 'pockeet_theme',
  SELECTED_CHAIN: 'pockeet_selected_chain',
  RECENT_ADDRESSES: 'pockeet_recent_addresses',
  YIELD_STRATEGY: 'pockeet_yield_strategy',
  SLIPPAGE: 'pockeet_slippage',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  AMOUNT_TOO_LOW: `Minimum amount is ${MIN_DEPOSIT_AMOUNT} USDC`,
  AMOUNT_TOO_HIGH: `Maximum amount is ${MAX_DEPOSIT_AMOUNT} USDC`,
  INVALID_ADDRESS: 'Invalid address',
  INVALID_ENS: 'Invalid ENS name',
  TRANSACTION_FAILED: 'Transaction failed',
  BRIDGE_FAILED: 'Bridge failed',
  NETWORK_ERROR: 'Network error, please try again',
  UNKNOWN_ERROR: 'An unknown error occurred',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  DEPOSIT_SUCCESS: 'Deposit successful!',
  WITHDRAW_SUCCESS: 'Withdrawal successful!',
  BRIDGE_STARTED: 'Bridge started successfully',
  SETTINGS_SAVED: 'Settings saved',
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  MULTI_CHAIN_DEPOSITS: true,
  YIELD_STRATEGIES: true,
  ENS_INTEGRATION: true,
  AUTO_WITHDRAW: true,
  NOTIFICATIONS: false, // Coming soon
  GOVERNANCE: false, // Coming soon
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  LIFI_ROUTES: '/api/lifi/routes',
  LIFI_QUOTE: '/api/lifi/quote',
  LIFI_STATUS: '/api/lifi/status',
  SUI_BALANCE: '/api/sui/balance',
  SUI_YIELD: '/api/sui/yield',
  ENS_RESOLVE: '/api/ens/resolve',
  ENS_PROFILE: '/api/ens/profile',
} as const;

export default {
  APP_NAME,
  APP_DESCRIPTION,
  APP_URL,
  NETWORKS,
  DEFAULT_NETWORK,
  CHAIN_IDS,
  SUI_CONFIG,
  ARC_CONFIG,
  USDC_DECIMALS,
  MIN_DEPOSIT_AMOUNT,
  MAX_DEPOSIT_AMOUNT,
  POLLING_INTERVALS,
  TIMEOUTS,
  YIELD_STRATEGIES,
  EXTERNAL_URLS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURES,
  API_ENDPOINTS,
};