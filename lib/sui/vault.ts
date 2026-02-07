import { getSuiClient, executeTransaction, getVaultBalance, formatUSDCAmount } from './client';
import { buildDepositTx, buildWithdrawTx } from './ptb';
import type { SuiNetwork } from './client';

export interface VaultInfo {
  id: string;
  totalDeposited: string;
  yieldEarned: string;
  userBalance: string;
  apy: string;
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

/** Normalize any Sui address/ID to a full zero-padded 0x-prefixed hex string. */
function normalizeAddress(addr: string): string {
  return '0x' + addr.replace(/^0x/, '').padStart(64, '0');
}

// Vault reads

export async function getVaultInfo(
  vaultId: string,
  userAddress: string,
  network: SuiNetwork = 'testnet'
): Promise<VaultInfo> {
  const client = getSuiClient(network);

  try {
    // 2.0: returns { object }, Move struct fields live in object.json
    const { object: vault } = await client.getObject({
      objectId: vaultId,
      include: { json: true },
    });

    const fields = vault.json;
    if (!fields) throw new Error('Invalid vault object');

    const totalDeposited = (fields.total_deposited as string) || '0';
    const yieldEarned    = (fields.yield_balance as string)   || '0';
    const userBalance    = await getVaultBalance(vaultId, userAddress, network);

    const apy =
      totalDeposited !== '0'
        ? ((parseFloat(yieldEarned) / parseFloat(totalDeposited)) * 100).toFixed(2)
        : '0.00';

    return {
      id: vaultId,
      totalDeposited: formatUSDCAmount(totalDeposited),
      yieldEarned:    formatUSDCAmount(yieldEarned),
      userBalance:    formatUSDCAmount(userBalance),
      apy,
    };
  } catch (error) {
    console.error('Error fetching vault info:', error);
    throw error;
  }
}

export async function getTVL(
  vaultId: string,
  network: SuiNetwork = 'testnet'
): Promise<string> {
  const client = getSuiClient(network);

  try {
    const { object: vault } = await client.getObject({
      objectId: vaultId,
      include: { json: true },
    });

    const fields = vault.json;
    if (!fields) return '0.00';

    return formatUSDCAmount((fields.total_deposited as string) || '0');
  } catch (error) {
    console.error('Error fetching TVL:', error);
    return '0.00';
  }
}

export async function vaultExists(
  vaultId: string,
  network: SuiNetwork = 'testnet'
): Promise<boolean> {
  const client = getSuiClient(network);
  try {
    await client.getObject({ objectId: vaultId });
    return true;
  } catch {
    return false;
  }
}


export async function depositToVault(
  vaultId: string,
  amount: string,
  userAddress: string,
  network: SuiNetwork = 'testnet'
): Promise<DepositResult> {
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const coinType  = `${packageId}::usdc::USDC`;

  const tx = buildDepositTx({ vaultId, packageId, coinType, amount, userAddress });
  const txDigest  = await executeTransaction(tx, network);
  const newBalance = await getVaultBalance(vaultId, userAddress, network);

  return {
    txDigest,
    amount:     formatUSDCAmount(amount),
    newBalance: formatUSDCAmount(newBalance),
  };
}

export async function withdrawFromVault(
  vaultId: string,
  amount: string,
  userAddress: string,
  network: SuiNetwork = 'testnet'
): Promise<WithdrawResult> {
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const coinType  = `${packageId}::usdc::USDC`;

  const currentBalance = await getVaultBalance(vaultId, userAddress, network);
  if (parseFloat(currentBalance) < parseFloat(amount)) {
    throw new Error('Insufficient balance');
  }

  const tx = buildWithdrawTx({ vaultId, packageId, coinType, amount });
  const txDigest  = await executeTransaction(tx, network);
  const newBalance = await getVaultBalance(vaultId, userAddress, network);

  return {
    txDigest,
    amount:     formatUSDCAmount(amount),
    newBalance: formatUSDCAmount(newBalance),
  };
}


export async function getVaultTransactions(
  vaultId: string,
  userAddress: string,
  network: SuiNetwork = 'testnet',
  limit: number = 20
) {
  console.warn('Vault transaction queries disabled due to GraphQL issues');
  return [];
}

export async function getUserDepositCount(
  userAddress: string,
  network: SuiNetwork = 'testnet'
): Promise<number> {
  // GraphQL queries are failing - return 0 for now
  return 0;
}

export default {
  getVaultInfo,
  depositToVault,
  withdrawFromVault,
  getVaultTransactions,
  getTVL,
  vaultExists,
  getUserDepositCount,
};