import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';

export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

// Endpoints
const GRPC_BASE_URLS: Record<SuiNetwork, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://localhost:9000',
};


const GRAPHQL_URLS: Record<SuiNetwork, string> = {
  mainnet: 'https://sui-mainnet.mystenlabs.com/graphql',
  testnet: 'https://sui-testnet.mystenlabs.com/graphql',
  devnet: 'https://sui-devnet.mystenlabs.com/graphql',
  localnet: 'http://localhost:9125/graphql',
};

// gRPC client pool
const grpcClients = new Map<SuiNetwork, SuiGrpcClient>();

export function getSuiClient(network: SuiNetwork = 'testnet'): SuiGrpcClient {
  if (!grpcClients.has(network)) {
    grpcClients.set(
      network,
      new SuiGrpcClient({
        baseUrl:
          network === 'testnet' && process.env.NEXT_PUBLIC_SUI_RPC_URL
            ? process.env.NEXT_PUBLIC_SUI_RPC_URL
            : GRPC_BASE_URLS[network],
        network,
      })
    );
  }
  return grpcClients.get(network)!;
}

// GraphQL client pool – only used for queryEvents
const graphqlClients = new Map<SuiNetwork, SuiGraphQLClient>();

function getGraphQLClient(network: SuiNetwork = 'testnet'): SuiGraphQLClient {
  if (!graphqlClients.has(network)) {
    graphqlClients.set(
      network,
      new SuiGraphQLClient({
        url: GRAPHQL_URLS[network],
        network,
      })
    );
  }
  return graphqlClients.get(network)!;
}

export function getKeypair(): Ed25519Keypair {
  const privateKey = process.env.NEXT_PUBLIC_SUI_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('NEXT_PUBLIC_SUI_PRIVATE_KEY is not set');
  }
  const cleanKey = privateKey.replace(/^suiprivkey/, '');
  return Ed25519Keypair.fromSecretKey(fromBase64(cleanKey));
}

export function getAddress(): string {
  return getKeypair().toSuiAddress();
}

export async function executeTransaction(
  tx: Transaction,
  network: SuiNetwork = 'testnet'
): Promise<string> {
  const client = getSuiClient(network);
  const keypair = getKeypair();

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    include: {
      effects: true,
      objectChanges: true,
    },
  });

  const executed = result.Transaction ?? result.FailedTransaction;

  if (!executed.effects.status.success) {
    throw new Error(`Transaction failed: ${executed.effects.status.error}`);
  }

  return executed.digest;
}

export async function getObject(
  objectId: string,
  network: SuiNetwork = 'testnet'
) {
  const client = getSuiClient(network);
  return client.getObject({
    objectId,
    include: { json: true },
  });
}

export async function getDynamicFields(
  parentId: string,
  network: SuiNetwork = 'testnet'
) {
  const client = getSuiClient(network);
  return client.listDynamicFields({ parentId });
}

export type SuiEventFilter =
  | { MoveEventType: string }
  | { Sender: string };

export async function queryEvents(
  query: SuiEventFilter,
  network: SuiNetwork = 'testnet',
  limit: number = 50
) {
  const client = getGraphQLClient(network);

  // Map our filter to GraphQL variables.
  // Note: filtering by Transaction digest is not supported in the GraphQL
  // events query – query the transaction directly instead.
  const type = 'MoveEventType' in query ? query.MoveEventType : undefined;
  const sender = 'Sender' in query ? query.Sender : undefined;

  return client.query({
    query: `
      query QueryEvents($type: String, $sender: SuiAddress, $first: Int) {
        events(
          first: $first
          filter: { type: $type, sender: $sender }
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            transactionModule {
              package { address }
              name
            }
            sender { address }
            contents {
              type { repr }
              bcs
            }
          }
        }
      }
    `,
    variables: { type, sender, first: limit },
  });
}

// Formatting

/** Raw MIST → SUI (9 decimals). */
export function formatSuiAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num / 1_000_000_000).toFixed(4);
}

/** Raw USDC → USD (6 decimals). */
export function formatUSDCAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num / 1_000_000).toFixed(2);
}

// Vault balance lookup

/** Hex string (with or without 0x prefix) → raw bytes. */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 8-byte little-endian Uint8Array → decimal string (BCS u64). */
function parseBcsU64(bytes: Uint8Array): string {
  let value = 0n;
  for (let i = 0; i < 8; i++) {
    value |= BigInt(bytes[i]) << BigInt(i * 8);
  }
  return value.toString();
}
export async function getVaultBalance(
  vaultId: string,
  userAddress: string,
  network: SuiNetwork = 'testnet'
): Promise<string> {
  const client = getSuiClient(network);

  try {
    const { object: vault } = await client.getObject({
      objectId: vaultId,
      include: { json: true },
    });

    const fields = vault.json;
    if (!fields) return '0';

    const balancesTableId = (
      fields.balances as { fields?: { id?: { id?: string } } }
    )?.fields?.id?.id;

    if (!balancesTableId) return '0';

    const { dynamicField } = await client.getDynamicField({
      parentId: balancesTableId,
      name: {
        type: 'address',
        bcs: hexToBytes(userAddress),
      },
    });

    return parseBcsU64(dynamicField.value.bcs);
  } catch (error) {
    console.error('Error fetching vault balance:', error);
    return '0';
  }
}

export default getSuiClient;