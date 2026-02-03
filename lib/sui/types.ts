export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export interface VaultInfo {
  id: string;
  totalDeposited: string;
  yieldEarned: string;
  userBalance: string;
  apy: string;
}

export interface VaultTransaction {
  type: 'deposit' | 'withdraw';
  user: string;
  amount: string;
  timestamp: string;
}

export interface DepositResult {
  txDigest: string;
  amount: string;
  newBalance: string;
}

export interface WithdrawResult {
  txDigest: string;
  amount: string;
  newBalance: string;
}

export interface YieldStrategy {
  id: string;
  name: string;
  apy: string;
  tvl: string;
  risk: 'low' | 'medium' | 'high';
  protocol: string;
}

export interface SuiCoin {
  coinType: string;
  coinObjectId: string;
  version: string;
  digest: string;
  balance: string;
  previousTransaction: string;
}

export interface SuiBalance {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance: {
    epochId: number;
    number: string;
  };
}

export interface VaultConfig {
  packageId: string;
  vaultId: string;
  coinType: string;
  network: SuiNetwork;
}

export interface PTBResult {
  digest: string;
  effects: {
    status: {
      status: 'success' | 'failure';
      error?: string;
    };
  };
  objectChanges?: any[];
}