#!/usr/bin/env ts-node

import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NETWORK    = process.env.SUI_NETWORK || 'testnet';
const RPC_URL    = process.env.SUI_RPC_URL  || 'https://fullnode.testnet.sui.io:443';
const VAULT_ID   = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID;
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;        // optional — needed for events
const USER_ADDRESS = process.env.USER_ADDRESS;                // optional

if (!VAULT_ID) {
  console.error('❌ Error: NEXT_PUBLIC_VAULT_OBJECT_ID not set');
  process.exit(1);
}

const vaultId = VAULT_ID as string;

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

function decodeVaultEvent(bcs: Uint8Array) {
  return {
    user:        bytesToHex(bcs.slice(0, 32)),
    amount:      readU64LE(bcs, 32),
    new_balance: readU64LE(bcs, 40),
  };
}

const GRAPHQL_URLS: Record<string, string> = {
  mainnet:  'https://sui-mainnet.mystenlabs.com/graphql',
  testnet:  'https://sui-testnet.mystenlabs.com/graphql',
  devnet:   'https://sui-devnet.mystenlabs.com/graphql',
  localnet: 'http://localhost:9125/graphql',
};

async function main() {
  console.log('🔍 Fetching Vault Information...\n');
  console.log(`Network: ${NETWORK}`);
  console.log(`Vault ID: ${vaultId}\n`);

  const client = new SuiGrpcClient({
    baseUrl: RPC_URL,
    network: NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet',
  });

  const { object: vault } = await client.getObject({
    objectId: vaultId,
    include: { json: true },
  });

  console.log('📦 Vault Details:\n');
  console.log(`Type:  ${vault.type}`);
  console.log(`Owner: ${JSON.stringify(vault.owner)}`);

  const fields = vault.json;
  if (!fields) {
    console.error('❌ Vault object has no content');
    process.exit(1);
  }

  console.log('\n💰 Vault Statistics:');
  const totalDeposited = (fields.total_deposited as string) || '0';
  const yieldBalance   = (fields.yield_balance   as string) || '0';
  const reserveValue   = (
    (fields.reserve as { fields?: { value?: string } })?.fields?.value
  ) || '0';

  console.log(`  Total Deposited:  ${Number(totalDeposited) / 1e9} SUI`);
  console.log(`  Yield Earned:     ${Number(yieldBalance)   / 1e9} SUI`);
  console.log(`  Reserve Balance:  ${Number(reserveValue)   / 1e9} SUI`);
  console.log(`  Paused:           ${fields.paused ? 'Yes' : 'No'}`);
  console.log(`  Version:          ${fields.version}`);

  if (Number(totalDeposited) > 0 && Number(yieldBalance) > 0) {
    const apy = (Number(yieldBalance) / Number(totalDeposited)) * 100;
    console.log(`  Current APY:      ${apy.toFixed(2)}%`);
  }

  if (USER_ADDRESS) {
    console.log('\n👤 User Balance:');

    const balancesTableId = (
      fields.balances as { fields?: { id?: { id?: string } } }
    )?.fields?.id?.id;

    if (balancesTableId) {
      try {
        const { dynamicField } = await client.getDynamicField({
          parentId: balancesTableId,
          name: {
            type: 'address',
            bcs:  hexToBytes(USER_ADDRESS),   // USER_ADDRESS is narrowed by the if above
          },
        });

        const balance = readU64LE(dynamicField.value.bcs, 0);
        console.log(`  Address: ${USER_ADDRESS}`);
        console.log(`  Balance: ${Number(balance) / 1e9} SUI`);

        if (Number(totalDeposited) > 0) {
          const share = (Number(balance) / Number(totalDeposited)) * 100;
          console.log(`  Share:   ${share.toFixed(2)}%`);
        }
      } catch {
        console.log(`  No deposits found for ${USER_ADDRESS}`);
      }
    } else {
      console.log(`  No deposits found for ${USER_ADDRESS}`);
    }
  }

  console.log('\n📊 Recent Events:');

  if (!PACKAGE_ID) {
    console.log('  (skipped — set NEXT_PUBLIC_PACKAGE_ID to enable event history)');
  } else {
    try {
      const graphqlClient = new SuiGraphQLClient({
        url: GRAPHQL_URLS[NETWORK] || GRAPHQL_URLS['testnet'],
        network: NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet',
      });

      // Fire both event types in parallel
      const eventsQuery = `
        query QueryEvents($type: String, $first: Int) {
          events(first: $first, filter: { type: $type }) {
            nodes {
              transactionModule { package { address } name }
              sender { address }
              transaction { digest }
              contents { type { repr } bcs }
            }
          }
        }
      `;

      const [depositResult, withdrawResult] = await Promise.all([
        graphqlClient.query({
          query: eventsQuery,
          variables: { type: `${PACKAGE_ID}::vault::DepositEvent`,  first: 5 },
        }),
        graphqlClient.query({
          query: eventsQuery,
          variables: { type: `${PACKAGE_ID}::vault::WithdrawEvent`, first: 5 },
        }),
      ]);

      interface EventNode {
        sender: { address: string };
        transaction?: { digest: string };
        contents: { type: { repr: string }; bcs: string };
      }
      interface EventsResponse {
        events: { nodes: EventNode[] };
      }

      const deposits    = ((depositResult  as EventsResponse).events?.nodes ?? []);
      const withdrawals = ((withdrawResult as EventsResponse).events?.nodes ?? []);

      // Merge, decode, filter to this vault, and show most recent 5
      const allEvents = [
        ...deposits.map((n) => ({ kind: 'deposit'  as const, node: n })),
        ...withdrawals.map((n) => ({ kind: 'withdraw' as const, node: n })),
      ];

      // Normalise an address for comparison
      const norm = (a: string) => '0x' + a.replace(/^0x/, '').padStart(64, '0');

      const filtered = allEvents.filter(({ node }) => {
        const decoded = decodeVaultEvent(hexToBytes(node.contents.bcs));
        return norm(decoded.user) === norm(vaultId) || true; // show all for now
      });

      if (filtered.length === 0) {
        console.log('  No events found');
      } else {
        filtered.slice(0, 5).forEach(({ kind, node }, index) => {
          const { user, amount, new_balance } = decodeVaultEvent(hexToBytes(node.contents.bcs));
          const label = kind === 'deposit' ? 'Deposit' : 'Withdrawal';
          console.log(`\n  Event ${index + 1}: ${label}`);
          console.log(`    User:    ${user}`);
          console.log(`    Amount:  ${Number(amount) / 1e9} SUI`);
          console.log(`    Balance: ${Number(new_balance) / 1e9} SUI`);
          if (node.transaction?.digest) {
            console.log(`    Tx:      ${node.transaction.digest}`);
          }
        });
      }
    } catch {
      console.log('  Could not fetch events');
    }
  }

  console.log(`\n🔗 Explorer: https://suiscan.xyz/${NETWORK}/object/${vaultId}`);
  console.log('\n✨ Done!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});