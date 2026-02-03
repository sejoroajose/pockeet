import type { Address } from 'viem';

/**
 * Common Types
 */

export type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export type ChainId = number;

export type TxHash = string;

export type Status = 'idle' | 'loading' | 'success' | 'error';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export type BridgeStatus = 'pending' | 'attested' | 'complete' | 'failed';

/**
 * User Types
 */

export interface User {
  address: Address;
  ensName?: string;
  avatar?: string;
}

export interface UserBalance {
  native: string;
  usdc: string;
  total: string;
}

/**
 * Transaction Types
 */

export interface Transaction {
  hash: TxHash;
  from: Address;
  to: Address;
  value: string;
  status: TransactionStatus;
  timestamp: number;
  chainId: ChainId;
}

export interface VaultTransaction {
  type: 'deposit' | 'withdraw';
  user: Address;
  amount: string;
  timestamp: number;
  txHash?: TxHash;
}

/**
 * Bridge Types
 */

export interface BridgeTransaction {
  id: string;
  fromChain: ChainId;
  toChain: ChainId;
  amount: string;
  status: BridgeStatus;
  startTime: number;
  estimatedTime: number;
  txHash?: TxHash;
  error?: string;
}

/**
 * Vault Types
 */

export interface Vault {
  id: string;
  totalDeposited: string;
  totalYield: string;
  userBalance: string;
  apy: string;
  strategy: YieldStrategy;
}

export interface VaultStats {
  tvl: string;
  totalUsers: number;
  totalYield: string;
  averageAPY: string;
}

/**
 * Yield Types
 */

export type YieldStrategy = 'conservative' | 'moderate' | 'aggressive';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  apy: string;
  tvl: string;
  risk: RiskLevel;
  protocol: string;
  active: boolean;
}

/**
 * Settings Types
 */

export interface UserSettings {
  defaultChain?: ChainId;
  slippage: number;
  yieldStrategy: YieldStrategy;
  autoWithdraw: boolean;
  withdrawThreshold: string;
  notifications: boolean;
}

export interface TreasurySettings {
  treasuryId?: string;
  autoWithdraw: boolean;
  withdrawThreshold: string;
  yieldStrategy: YieldStrategy;
  notificationChannel?: string;
  preferredChain?: ChainId;
  riskTolerance: RiskLevel;
  email?: string;
  telegram?: string;
  discord?: string;
}

/**
 * API Response Types
 */

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Chart Data Types
 */

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface BalanceHistory {
  date: string;
  balance: number;
  yield: number;
}

/**
 * Notification Types
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

/**
 * Component Prop Types
 */

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

/**
 * Form Types
 */

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface DepositForm {
  amount: FormField;
  fromChain: FormField<ChainId>;
}

export interface WithdrawForm {
  amount: FormField;
  toChain: FormField<ChainId>;
  toAddress: FormField<Address>;
}

/**
 * Utility Types
 */

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncResult<T> = Promise<[T | null, Error | null]>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];