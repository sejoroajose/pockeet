import type { Address, Hash } from 'viem';

export interface BridgeResult {
  burnTxHash: Hash;
  amount: string;
  recipient: string;
  attestation?: string;
}

export interface SuiBridgeResult {
  txDigest: string;
  amount: string;
  recipient: string;
}

export interface BridgeStatus {
  status: 'pending' | 'attested' | 'complete' | 'failed';
  attestation?: string;
  error?: string;
}

export interface BridgeFeeEstimate {
  gasEstimate: string;
  bridgeFee: string;
  total: string;
}

export interface CCTPMessage {
  version: number;
  sourceDomain: number;
  destinationDomain: number;
  nonce: bigint;
  sender: Address;
  recipient: Address;
  destinationCaller: Address;
  messageBody: string;
}

export interface AttestationResponse {
  status: 'pending' | 'complete';
  attestation?: string;
}

export interface ArcBalance {
  native: bigint;
  usdc: bigint;
}