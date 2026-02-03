import { getSuiClient, executeTransaction, getVaultBalance, formatUSDCAmount, queryEvents } from './client';
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

// BCS event decoding

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readU64LE(bytes: Uint8Array, offset: number): string {
  let value = 0n;
  for (let i = 0; i < 8; i++) {
    value |= BigInt(bytes[offset + i]) << BigInt(i * 8);
  }
  return value.toString();
}

/** Normalize any Sui address/ID to a full zero-padded 0x-prefixed hex string. */
function normalizeAddress(addr: string): string {
  return '0x' + addr.replace(/^0x/, '').padStart(64, '0');
}

interface DecodedVaultEvent {
  vaultId: string; // 0x-prefixed, full 32 bytes
  user: string;    // 0x-prefixed, full 32 bytes
  amount: string;  // raw u64 as decimal string
}

function decodeVaultEvent(bcsHex: string): DecodedVaultEvent {
  const bytes = hexToBytes(bcsHex);
  return {
    vaultId: bytesToHex(bytes.slice(0, 32)),  // ID      = 32 bytes
    user:    bytesToHex(bytes.slice(32, 64)), // address = 32 bytes
    amount:  readU64LE(bytes, 64),            // u64 LE  =  8 bytes
  };
}

// GraphQL response types — match the query in client.ts queryEvents
interface EventNode {
  transactionModule: { package: { address: string }; name: string };
  sender: { address: string };
  transaction?: { digest: string };
  contents: { type: { repr: string }; bcs: string };
}

interface QueryEventsResponse {
  events: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: EventNode[];
  };
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

// 2.0: GetObjectResponse is { object: Object<Include> } — it doesn't have a
// nullable .data wrapper. If the object doesn't exist the call throws, so the
// try/catch is all we need.
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

// ---------------------------------------------------------------------------
// Vault writes
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Event queries — GraphQL only (no gRPC equivalent per migration docs)
// ---------------------------------------------------------------------------

export async function getVaultTransactions(
  vaultId: string,
  userAddress: string,
  network: SuiNetwork = 'testnet',
  limit: number = 20
) {
  const packageId      = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const normalizedVault = normalizeAddress(vaultId);
  const normalizedUser  = normalizeAddress(userAddress);

  try {
    // queryEvents wraps GraphQL internally. Fire both event types in parallel.
    const [depositResult, withdrawResult] = await Promise.all([
      queryEvents({ MoveEventType: `${packageId}::vault::DepositEvent` },  network, limit),
      queryEvents({ MoveEventType: `${packageId}::vault::WithdrawEvent` }, network, limit),
    ]);

    const deposits    = (depositResult  as QueryEventsResponse).events?.nodes ?? [];
    const withdrawals = (withdrawResult as QueryEventsResponse).events?.nodes ?? [];

    // Decode BCS event contents and flatten into a single list.
    const allEvents = [
      ...deposits.map((node) => ({
        type: 'deposit' as const,
        ...decodeVaultEvent(node.contents.bcs),
        txDigest: node.transaction?.digest ?? null,
      })),
      ...withdrawals.map((node) => ({
        type: 'withdraw' as const,
        ...decodeVaultEvent(node.contents.bcs),
        txDigest: node.transaction?.digest ?? null,
      })),
    ];

    // Filter to this vault + user, cap at limit.
    return allEvents
      .filter(
        (e) =>
          normalizeAddress(e.vaultId) === normalizedVault &&
          normalizeAddress(e.user)    === normalizedUser
      )
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function getUserDepositCount(
  userAddress: string,
  network: SuiNetwork = 'testnet'
): Promise<number> {
  const packageId      = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const normalizedUser = normalizeAddress(userAddress);

  try {
    const result = await queryEvents(
      { MoveEventType: `${packageId}::vault::DepositEvent` },
      network,
      1000
    );

    const nodes = (result as QueryEventsResponse).events?.nodes ?? [];

    return nodes.filter((node) => {
      const { user } = decodeVaultEvent(node.contents.bcs);
      return normalizeAddress(user) === normalizedUser;
    }).length;
  } catch {
    return 0;
  }
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