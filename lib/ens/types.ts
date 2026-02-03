import type { Address } from 'viem';

export interface ENSProfile {
  name: string;
  address: Address;
  avatar?: string;
  email?: string;
  url?: string;
  description?: string;
  twitter?: string;
  github?: string;
}

export interface TreasurySettings {
  treasuryId?: string;
  autoWithdraw: boolean;
  withdrawThreshold: string;
  yieldStrategy: 'conservative' | 'moderate' | 'aggressive';
  notificationChannel?: string;
  preferredChain?: string;
  riskTolerance: 'low' | 'medium' | 'high';
  email?: string;
  telegram?: string;
  discord?: string;
}

export interface ENSTextRecord {
  key: string;
  value: string;
}

export interface ENSResolver {
  address: Address;
  contentHash?: string;
  texts: ENSTextRecord[];
}

export interface ENSValidation {
  valid: boolean;
  error?: string;
}