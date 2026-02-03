'use client';

import { useState, useEffect, useCallback } from 'react';
import {  useConnection } from 'wagmi';
import { getVaultInfo, depositToVault, withdrawFromVault, getVaultTransactions, getTVL } from './vault';
import type { VaultInfo } from './vault';
import type { SuiNetwork } from './client';

export function useVaultInfo(vaultId?: string, network: SuiNetwork = 'testnet') {
  const { address } = useConnection();
  const [info, setInfo] = useState<VaultInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vaultId || !address) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchInfo() {
      if (!vaultId || !address) return;
      
      setLoading(true);
      setError(null);

      try {
          const data = await getVaultInfo(vaultId, address, network);
          if (mounted) {
          setInfo(data);
          }
      } catch (err) {
          if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch vault info');
          }
      } finally {
          if (mounted) {
          setLoading(false);
          }
      }
    }

    fetchInfo();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchInfo, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [vaultId, address, network]);

  return { info, loading, error };
}

// Hook for vault deposits
export function useVaultDeposit(vaultId?: string, network: SuiNetwork = 'testnet') {
  const { address } =  useConnection();
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const deposit = useCallback(async (amount: string) => {
    if (!vaultId || !address) {
      throw new Error('Vault ID and address required');
    }

    setDepositing(true);
    setError(null);
    setTxDigest(null);

    try {
      const result = await depositToVault(vaultId, amount, address, network);
      setTxDigest(result.txDigest);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Deposit failed';
      setError(errorMsg);
      throw err;
    } finally {
      setDepositing(false);
    }
  }, [vaultId, address, network]);

  const reset = useCallback(() => {
    setError(null);
    setTxDigest(null);
  }, []);

  return { deposit, depositing, error, txDigest, reset };
}

// Hook for vault withdrawals
export function useVaultWithdraw(vaultId?: string, network: SuiNetwork = 'testnet') {
  const { address } =  useConnection();
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const withdraw = useCallback(async (amount: string) => {
    if (!vaultId || !address) {
      throw new Error('Vault ID and address required');
    }

    setWithdrawing(true);
    setError(null);
    setTxDigest(null);

    try {
      const result = await withdrawFromVault(vaultId, amount, address, network);
      setTxDigest(result.txDigest);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(errorMsg);
      throw err;
    } finally {
      setWithdrawing(false);
    }
  }, [vaultId, address, network]);

  const reset = useCallback(() => {
    setError(null);
    setTxDigest(null);
  }, []);

  return { withdraw, withdrawing, error, txDigest, reset };
}

// Hook for vault transactions
export function useVaultTransactions(
  vaultId?: string,
  network: SuiNetwork = 'testnet',
  limit: number = 20
) {
  const { address } =  useConnection();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vaultId || !address) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchTransactions() {
      if (!vaultId || !address) return;
      
      setLoading(true);
      setError(null);

      try {
        const txs = await getVaultTransactions(vaultId, address, network, limit);
        if (mounted) {
          setTransactions(txs);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTransactions();
    
    // Refresh every minute
    const interval = setInterval(fetchTransactions, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [vaultId, address, network, limit]);

  return { transactions, loading, error };
}

// Hook for TVL
export function useTVL(vaultId?: string, network: SuiNetwork = 'testnet') {
  const [tvl, setTvl] = useState<string>('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vaultId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchTVL() {
      if (!vaultId) return;
      
      try {
        const value = await getTVL(vaultId, network);
        if (mounted) {
          setTvl(value);
        }
      } catch (err) {
        console.error('Failed to fetch TVL:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTVL();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTVL, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [vaultId, network]);

  return { tvl, loading };
}

// Combined hook for all vault data
export function useVault(vaultId?: string, network: SuiNetwork = 'testnet') {
  const vaultInfo = useVaultInfo(vaultId, network);
  const vaultDeposit = useVaultDeposit(vaultId, network);
  const vaultWithdraw = useVaultWithdraw(vaultId, network);
  const vaultTransactions = useVaultTransactions(vaultId, network);
  const vaultTVL = useTVL(vaultId, network);

  return {
    // Info
    info: vaultInfo.info,
    infoLoading: vaultInfo.loading,
    infoError: vaultInfo.error,
    
    // Deposit
    deposit: vaultDeposit.deposit,
    depositing: vaultDeposit.depositing,
    depositError: vaultDeposit.error,
    depositTxDigest: vaultDeposit.txDigest,
    resetDeposit: vaultDeposit.reset,
    
    // Withdraw
    withdraw: vaultWithdraw.withdraw,
    withdrawing: vaultWithdraw.withdrawing,
    withdrawError: vaultWithdraw.error,
    withdrawTxDigest: vaultWithdraw.txDigest,
    resetWithdraw: vaultWithdraw.reset,
    
    // Transactions
    transactions: vaultTransactions.transactions,
    transactionsLoading: vaultTransactions.loading,
    transactionsError: vaultTransactions.error,
    
    // TVL
    tvl: vaultTVL.tvl,
    tvlLoading: vaultTVL.loading,
  };
}