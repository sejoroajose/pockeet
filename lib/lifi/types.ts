import type { Route, RoutesRequest, LiFiStep, RouteOptions } from '@lifi/sdk';

export type { Route, RoutesRequest, LiFiStep, RouteOptions };

export interface BridgeOptions {
  fromChainId: number;
  toChainId: number;
  tokenAddress: string;
  amount: string;
  fromAddress: string;
  toAddress?: string;
  slippage?: number;
  order?: 'CHEAPEST' | 'FASTEST';
}

export interface RouteInfo {
  id: string;
  from: {
    chainId: number;
    chainName: string;
    token: string;
    amount: string;
  };
  to: {
    chainId: number;
    chainName: string;
    token: string;
    amount: string;
  };
  steps: StepInfo[];
  fees: FeeInfo;
  duration: number; // in minutes
  priceImpact: number; // percentage
}

export interface StepInfo {
  type: 'swap' | 'bridge' | 'custom';
  tool: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status?: 'idle' | 'pending' | 'running' | 'done' | 'failed';
}

export interface FeeInfo {
  gas: string; // in USD
  protocol: string; // in USD
  total: string; // in USD
}

export interface ExecutionStatus {
  progress: number; // 0-100
  currentStep: string | null;
  status: 'idle' | 'running' | 'complete' | 'failed';
  error?: string;
}

export interface BridgeStatus {
  status: 'pending' | 'running' | 'done' | 'failed';
  substatus?: string;
  message?: string;
  txHash?: string;
}

export interface ChainInfo {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  color: string;
}