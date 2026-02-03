'use client';

import { executeRoute as lifiExecuteRoute } from '@lifi/sdk';
import type { Route, RouteExtended } from '@lifi/sdk';
import type { WalletClient } from 'viem';
import { getWalletClient } from '@wagmi/core';
import type { Config } from 'wagmi';

export interface ExecutionCallbacks {
  onStepUpdate?: (update: RouteExtended) => void;
  onSuccess?: (route: RouteExtended) => void;
  onError?: (error: Error, route: RouteExtended) => void;
}

export interface ExecuteRouteConfig {
  /**
   * Wagmi config instance - required for chain switching
   */
  wagmiConfig: Config;
  
  /**
   * Function to switch chains - from wagmi's useSwitchChain hook
   */
  switchChain: (params: { chainId: number }) => Promise<void>;
  
  /**
   * Maximum slippage change to accept (as percentage, e.g., 5 for 5%)
   */
  maxSlippageChange?: number;
  updateRouteHook?: (route: RouteExtended) => void;
}

/**
 * Execute a bridge route
 */
export async function executeRoute(
  route: Route,
  config: ExecuteRouteConfig,
  callbacks?: ExecutionCallbacks
): Promise<RouteExtended> {
  const { wagmiConfig, switchChain, maxSlippageChange = 5 } = config;
  
  return new Promise((resolve, reject) => {
    lifiExecuteRoute(route, {
      updateRouteHook: (updatedRoute) => {
        callbacks?.onStepUpdate?.(updatedRoute);
        
        // Check if all steps are complete
        const allComplete = updatedRoute.steps.every(
          step => step.execution?.status === 'DONE'
        );
        
        if (allComplete) {
          callbacks?.onSuccess?.(updatedRoute);
          resolve(updatedRoute);
        }
        
        // Check if any step failed
        const anyFailed = updatedRoute.steps.some(
          step => step.execution?.status === 'FAILED'
        );
        
        if (anyFailed) {
          const error = new Error('Route execution failed');
          callbacks?.onError?.(error, updatedRoute);
          reject(error);
        }
      },
      
      switchChainHook: async (requiredChainId: number): Promise<WalletClient | undefined> => {
        try {
          // Switch to the required chain using wagmi
          await switchChain({ chainId: requiredChainId });
          
          // Get the wallet client for the new chain
          const walletClient = await getWalletClient(wagmiConfig, {
            chainId: requiredChainId,
          });
          
          return walletClient as WalletClient | undefined;
        } catch (error) {
          console.error('Failed to switch chain:', error);
          throw error;
        }
      },
      
      acceptExchangeRateUpdateHook: async (params) => {
        try {
          const oldAmount = BigInt(params.oldToAmount);
          const newAmount = BigInt(params.newToAmount);
          
          // Calculate percentage change
          // Using 10000 for basis points (0.01%)
          const change = Number(((newAmount - oldAmount) * 10000n) / oldAmount) / 100;
          
          // Accept if change is within acceptable range
          const isAcceptable = Math.abs(change) <= maxSlippageChange;
          
          if (!isAcceptable) {
            console.warn(
              `Exchange rate changed by ${change.toFixed(2)}% which exceeds max of ${maxSlippageChange}%`
            );
          }
          
          return isAcceptable;
        } catch (error) {
          console.error('Error processing exchange rate update:', error);
          return false;
        }
      },
    }).catch((error) => {
      callbacks?.onError?.(error, route as RouteExtended);
      reject(error);
    });
  });
}

/**
 * Get execution progress percentage
 */
export function getExecutionProgress(route: RouteExtended): number {
  const totalSteps = route.steps.length;
  let completedSteps = 0;
  
  route.steps.forEach(step => {
    if (step.execution?.status === 'DONE') {
      completedSteps++;
    } else if (step.execution?.status === 'PENDING') {
      // Count pending as half complete
      completedSteps += 0.5;
    }
  });
  
  return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Get current step being executed
 */
export function getCurrentStep(route: RouteExtended): {
  index: number;
  name: string;
  status: string;
} | null {
  for (let i = 0; i < route.steps.length; i++) {
    const step = route.steps[i];
    
    if (step.execution?.status === 'PENDING' || step.execution?.status === 'ACTION_REQUIRED') {
      return {
        index: i + 1,
        name: step.toolDetails.name,
        status: step.execution.status,
      };
    }
  }
  
  return null;
}

/**
 * Check if execution is complete
 */
export function isExecutionComplete(route: RouteExtended): boolean {
  return route.steps.every(step => step.execution?.status === 'DONE');
}

/**
 * Check if execution failed
 */
export function isExecutionFailed(route: RouteExtended): boolean {
  return route.steps.some(step => step.execution?.status === 'FAILED');
}

/**
 * Get execution status summary
 */
export function getExecutionSummary(route: RouteExtended): {
  progress: number;
  currentStep: string | null;
  status: 'idle' | 'running' | 'complete' | 'failed';
  error?: string;
} {
  const progress = getExecutionProgress(route);
  const currentStep = getCurrentStep(route);
  
  let status: 'idle' | 'running' | 'complete' | 'failed' = 'idle';
  let error: string | undefined;
  
  if (isExecutionComplete(route)) {
    status = 'complete';
  } else if (isExecutionFailed(route)) {
    status = 'failed';
    const failedStep = route.steps.find(s => s.execution?.status === 'FAILED');
    // Access error through process array
    const processes = failedStep?.execution?.process || [];
    error = processes[processes.length - 1]?.error?.message || 'Execution failed';
  } else if (currentStep) {
    status = 'running';
  }
  
  return {
    progress,
    currentStep: currentStep?.name || null,
    status,
    error,
  };
}

/**
 * Get transaction hashes from a route
 */
export function getTransactionHashes(route: RouteExtended): Array<{
  stepIndex: number;
  processType: string;
  txHash: string;
  explorerLink?: string;
}> {
  const hashes: Array<{
    stepIndex: number;
    processType: string;
    txHash: string;
    explorerLink?: string;
  }> = [];
  
  route.steps.forEach((step, index) => {
    step.execution?.process?.forEach((process) => {
      if (process.txHash) {
        hashes.push({
          stepIndex: index + 1,
          processType: process.type,
          txHash: process.txHash,
          explorerLink: process.txLink,
        });
      }
    });
  });
  
  return hashes;
}

export default {
  executeRoute,
  getExecutionProgress,
  getCurrentStep,
  isExecutionComplete,
  isExecutionFailed,
  getExecutionSummary,
  getTransactionHashes,
};