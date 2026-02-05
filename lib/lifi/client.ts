'use client';

import { createConfig, ChainId, getRoutes as lifiGetRoutes, getStatus } from '@lifi/sdk';
import type { Route, RoutesRequest, LiFiStep, RouteOptions } from '@lifi/sdk';

let isConfigured = false;

/**
 * Initialize LI.FI SDK
 */
export function initializeLiFi() {
  if (isConfigured) return;
  
  createConfig({
    integrator: process.env.NEXT_PUBLIC_LIFI_INTEGRATOR || 'pockeet',
    apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY,
  });
  
  isConfigured = true;
}

/**
 * Get available routes between chains
 */
export async function findRoutes(
  fromChainId: number,
  toChainId: number,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  fromAddress: string,
  toAddress?: string,
  options?: Partial<RouteOptions>
): Promise<Route[]> {
  initializeLiFi();
  
  const request: RoutesRequest = {
    fromChainId,
    toChainId,
    fromTokenAddress: fromTokenAddress as `0x${string}`,
    toTokenAddress: toTokenAddress as `0x${string}`,
    fromAmount: amount,
    fromAddress: fromAddress as `0x${string}`,
    toAddress: (toAddress || fromAddress) as `0x${string}`,
    options: {
      slippage: options?.slippage || 0.005, // 0.5% default
      order: options?.order || 'CHEAPEST',
      allowSwitchChain: options?.allowSwitchChain ?? true,
      ...options,
    },
  };
  
  try {
    const result = await lifiGetRoutes(request);
    return result.routes || [];
  } catch (error) {
    console.error('Failed to find routes:', error);
    return [];
  }
}

/**
 * Get best route (cheapest or fastest)
 */
export async function getBestRoute(
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
  amount: string,
  fromAddress: string,
  order: 'CHEAPEST' | 'FASTEST' = 'CHEAPEST'
): Promise<Route | null> {
  const routes = await findRoutes(
    fromChainId,
    toChainId,
    tokenAddress,
    tokenAddress, // Same token on both chains
    amount,
    fromAddress,
    fromAddress,
    { order }
  );
  
  return routes[0] || null;
}

/**
 * Get route status by transaction hash
 */
export async function getRouteStatus(txHash: string): Promise<{
  status: string;
  substatus?: string;
  substatusMessage?: string;
}> {
  initializeLiFi();
  
  try {
    const status = await getStatus({
      txHash: txHash as `0x${string}`,
    });
    
    return {
      status: status.status,
      substatus: status.substatus,
      substatusMessage: status.substatusMessage,
    };
  } catch (error) {
    console.error('Failed to get route status:', error);
    return {
      status: 'FAILED',
      substatusMessage: 'Failed to fetch status',
    };
  }
}

/**
 * Calculate total fees for a route
 */
export function calculateRouteFees(route: Route): {
  gasCosts: string;
  feeCosts: string;
  total: string;
} {
  let totalGas = 0;
  let totalFees = 0;
  
  route.steps.forEach((step: LiFiStep) => {
    if (step.estimate.gasCosts) {
      step.estimate.gasCosts.forEach(gas => {
        totalGas += parseFloat(gas.amountUSD || '0');
      });
    }
    
    if (step.estimate.feeCosts) {
      step.estimate.feeCosts.forEach(fee => {
        totalFees += parseFloat(fee.amountUSD || '0');
      });
    }
  });
  
  return {
    gasCosts: totalGas.toFixed(2),
    feeCosts: totalFees.toFixed(2),
    total: (totalGas + totalFees).toFixed(2),
  };
}

/**
 * Estimate route duration in minutes
 */
export function estimateRouteDuration(route: Route): number {
  let totalSeconds = 0;
  
  route.steps.forEach((step: LiFiStep) => {
    totalSeconds += step.estimate.executionDuration || 0;
  });
  
  return Math.ceil(totalSeconds / 60); // Convert to minutes
}

/**
 * Format route for display
 */
export function formatRoute(route: Route): {
  from: { chain: string; token: string };
  to: { chain: string; token: string };
  steps: string[];
  fees: string;
  duration: number;
  outputAmount: string;
} {
  const firstStep = route.steps[0];
  const lastStep = route.steps[route.steps.length - 1];
  
  return {
    from: {
      chain: firstStep.action.fromChainId.toString(),
      token: firstStep.action.fromToken.symbol,
    },
    to: {
      chain: lastStep.action.toChainId.toString(),
      token: lastStep.action.toToken.symbol,
    },
    steps: route.steps.map(s => s.toolDetails.name),
    fees: calculateRouteFees(route).total,
    duration: estimateRouteDuration(route),
    outputAmount: lastStep.estimate.toAmount,
  };
}

/**
 * Check if route is valid
 */
export function isRouteValid(route: Route): boolean {
  if (!route || !route.steps || route.steps.length === 0) {
    return false;
  }
  
  // Check all steps have required data
  return route.steps.every(step => 
    step.action &&
    step.estimate &&
    step.toolDetails
  );
}

export { ChainId };
export type { Route, RoutesRequest, LiFiStep };