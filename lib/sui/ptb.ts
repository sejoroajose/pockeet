import { Transaction } from '@mysten/sui/transactions';

export interface VaultDepositArgs {
  vaultId: string;
  packageId: string;
  coinType: string;
  amount: string;
  userAddress: string;
}

export interface VaultWithdrawArgs {
  vaultId: string;
  packageId: string;
  coinType: string;
  amount: string;
}

export interface YieldDepositArgs {
  vaultId: string;
  strategyId: string;
  packageId: string;
  coinType: string;
  amount: string;
}

// Build deposit transaction
export function buildDepositTx(args: VaultDepositArgs): Transaction {
  const tx = new Transaction();
  
  // Split coin if needed
  const [coin] = tx.splitCoins(tx.gas, [args.amount]);
  
  // Call deposit function
  tx.moveCall({
    target: `${args.packageId}::vault::deposit`,
    arguments: [
      tx.object(args.vaultId),
      coin,
    ],
    typeArguments: [args.coinType],
  });
  
  return tx;
}


export interface VaultWithdrawToArgs {
  vaultId: string;
  packageId: string;
  coinType: string;
  ownerAddress: string;
  recipientAddress: string;
  amount: string;
}

export function buildWithdrawToTx(args: VaultWithdrawToArgs): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${args.packageId}::vault::withdraw_to`,
    arguments: [
      tx.object(args.vaultId),
      tx.pure.address(args.ownerAddress),
      tx.pure.address(args.recipientAddress),
      tx.pure.u64(args.amount),
    ],
    typeArguments: [args.coinType],
  });
  
  return tx;
}

// Build withdraw transaction
export function buildWithdrawTx(args: VaultWithdrawArgs): Transaction {
  const tx = new Transaction();
  
  // Call withdraw function
  tx.moveCall({
    target: `${args.packageId}::vault::withdraw`,
    arguments: [
      tx.object(args.vaultId),
      tx.pure.u64(args.amount),
    ],
    typeArguments: [args.coinType],
  });
  
  return tx;
}

// Build yield deposit transaction
export function buildYieldDepositTx(args: YieldDepositArgs): Transaction {
  const tx = new Transaction();
  
  // First, withdraw from vault
  tx.moveCall({
    target: `${args.packageId}::vault::withdraw`,
    arguments: [
      tx.object(args.vaultId),
      tx.pure.u64(args.amount),
    ],
    typeArguments: [args.coinType],
  });
  
  // Then deposit to yield strategy
  // This is a placeholder - actual strategy call depends on protocol
  tx.moveCall({
    target: `${args.packageId}::yield_strategy::deposit`,
    arguments: [
      tx.object(args.strategyId),
      tx.object(args.vaultId),
      tx.pure.u64(args.amount),
    ],
    typeArguments: [args.coinType],
  });
  
  return tx;
}

// Build batch deposit from multiple coins
export function buildBatchDepositTx(
  vaultId: string,
  packageId: string,
  coinType: string,
  coinIds: string[]
): Transaction {
  const tx = new Transaction();
  
  if (coinIds.length === 0) {
    throw new Error('No coins provided');
  }
  
  // Merge all coins
  const [primaryCoin, ...otherCoins] = coinIds.map(id => tx.object(id));
  
  if (otherCoins.length > 0) {
    tx.mergeCoins(primaryCoin, otherCoins);
  }
  
  // Deposit merged coin
  tx.moveCall({
    target: `${packageId}::vault::deposit`,
    arguments: [
      tx.object(vaultId),
      primaryCoin,
    ],
    typeArguments: [coinType],
  });
  
  return tx;
}

// Build swap and deposit transaction (DeepBook integration)
export function buildSwapAndDepositTx(
  vaultId: string,
  packageId: string,
  poolId: string,
  fromCoinType: string,
  toCoinType: string,
  amount: string
): Transaction {
  const tx = new Transaction();
  
  // Split coin for swap
  const [coinToSwap] = tx.splitCoins(tx.gas, [amount]);
  
  // Swap on DeepBook (simplified)
  const [swappedCoin] = tx.moveCall({
    target: `0xdee9::clob_v2::swap_exact_base_for_quote`,
    arguments: [
      tx.object(poolId),
      coinToSwap,
      tx.pure.u64(0), // Min output
      tx.object('0x6'), // Clock
    ],
    typeArguments: [fromCoinType, toCoinType],
  });
  
  // Deposit to vault
  tx.moveCall({
    target: `${packageId}::vault::deposit`,
    arguments: [
      tx.object(vaultId),
      swappedCoin,
    ],
    typeArguments: [toCoinType],
  });
  
  return tx;
}

// Build complex yield rebalance transaction
export function buildRebalanceTx(
  vaultId: string,
  packageId: string,
  coinType: string,
  fromStrategyId: string,
  toStrategyId: string,
  amount: string
): Transaction {
  const tx = new Transaction();
  
  // Withdraw from old strategy
  const [withdrawnCoin] = tx.moveCall({
    target: `${packageId}::yield_strategy::withdraw`,
    arguments: [
      tx.object(fromStrategyId),
      tx.pure.u64(amount),
    ],
    typeArguments: [coinType],
  });
  
  // Deposit to new strategy
  tx.moveCall({
    target: `${packageId}::yield_strategy::deposit`,
    arguments: [
      tx.object(toStrategyId),
      tx.object(vaultId),
      withdrawnCoin,
    ],
    typeArguments: [coinType],
  });
  
  return tx;
}

// Build emergency withdraw transaction
export function buildEmergencyWithdrawTx(
  vaultId: string,
  packageId: string,
  coinType: string,
  adminCapId: string
): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${packageId}::vault::emergency_withdraw`,
    arguments: [
      tx.object(adminCapId),
      tx.object(vaultId),
    ],
    typeArguments: [coinType],
  });
  
  return tx;
}

// Utility: Get gas budget estimate
export function estimateGasBudget(complexity: 'simple' | 'medium' | 'complex'): number {
  switch (complexity) {
    case 'simple':
      return 10_000_000; // 0.01 SUI
    case 'medium':
      return 50_000_000; // 0.05 SUI
    case 'complex':
      return 100_000_000; // 0.1 SUI
    default:
      return 10_000_000;
  }
}

export default {
  buildDepositTx,
  buildWithdrawTx,
  buildYieldDepositTx,
  buildBatchDepositTx,
  buildSwapAndDepositTx,
  buildRebalanceTx,
  buildEmergencyWithdrawTx,
  estimateGasBudget,
};