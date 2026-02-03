#!/usr/bin/env ts-node

import { SuiGrpcClient } from '@mysten/sui/grpc';

const NETWORK = process.env.SUI_NETWORK || 'testnet';
const RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const VAULT_ID = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID;
const USER_ADDRESS = process.env.USER_ADDRESS; // Optional

if (!VAULT_ID) {
  console.error('❌ Error: NEXT_PUBLIC_VAULT_OBJECT_ID not set');
  process.exit(1);
}

async function main() {
  console.log('🔍 Fetching Vault Information...\n');
  console.log(`Network: ${NETWORK}`);
  console.log(`Vault ID: ${VAULT_ID}\n`);

  const client = new SuiGrpcClient({ 
    baseUrl: RPC_URL,
    network: NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet'
  });
    

  // Get vault object
  const vaultObject = await client.getObject({
    id: VAULT_ID,
    options: {
      showContent: true,
      showOwner: true,
      showType: true,
    },
  });

  if (!vaultObject.data) {
    console.error('❌ Vault not found');
    process.exit(1);
  }

  console.log('📦 Vault Details:\n');
  console.log(`Type: ${vaultObject.data.type}`);
  console.log(`Owner: ${JSON.stringify(vaultObject.data.owner)}`);

  if (vaultObject.data.content && vaultObject.data.content.dataType === 'moveObject') {
    const fields = vaultObject.data.content.fields as any;

    console.log('\n💰 Vault Statistics:');
    console.log(`  Total Deposited: ${Number(fields.total_deposited) / 1e9} SUI`);
    console.log(`  Yield Earned: ${Number(fields.yield_balance) / 1e9} SUI`);
    console.log(
      `  Reserve Balance: ${Number(fields.reserve?.fields?.value || 0) / 1e9} SUI`
    );
    console.log(`  Paused: ${fields.paused ? 'Yes' : 'No'}`);
    console.log(`  Version: ${fields.version}`);

    // Calculate APY if there's yield
    if (fields.total_deposited > 0 && fields.yield_balance > 0) {
      const apy = (Number(fields.yield_balance) / Number(fields.total_deposited)) * 100;
      console.log(`  Current APY: ${apy.toFixed(2)}%`);
    }

    // Get user balance if address provided
    if (USER_ADDRESS) {
      console.log('\n👤 User Balance:');
      const balancesTableId = fields.balances?.fields?.id?.id;

      if (balancesTableId) {
        try {
          const userBalance = await client.getDynamicField({
            parentId: balancesTableId,
            name: {
              type: 'address',
              value: USER_ADDRESS,
            },
          });

          if (userBalance.data?.content && userBalance.data.content.dataType === 'moveObject') {
            const balance = (userBalance.data.content.fields as any).value;
            console.log(`  Address: ${USER_ADDRESS}`);
            console.log(`  Balance: ${Number(balance) / 1e9} SUI`);

            if (fields.total_deposited > 0) {
              const share = (Number(balance) / Number(fields.total_deposited)) * 100;
              console.log(`  Share: ${share.toFixed(2)}%`);
            }
          } else {
            console.log(`  No deposits found for ${USER_ADDRESS}`);
          }
        } catch (error) {
          console.log(`  No deposits found for ${USER_ADDRESS}`);
        }
      }
    }
  }

  // Get recent events
  console.log('\n📊 Recent Events:');
  try {
    const events = await client.queryEvents({
      query: { Transaction: VAULT_ID },
      limit: 10,
      order: 'descending',
    });

    if (events.data.length === 0) {
      console.log('  No events found');
    } else {
      events.data.slice(0, 5).forEach((event, index) => {
        const type = event.type.split('::').pop();
        console.log(`\n  Event ${index + 1}: ${type}`);
        if (event.parsedJson) {
          const parsed = event.parsedJson as any;
          if (parsed.user) console.log(`    User: ${parsed.user}`);
          if (parsed.amount) console.log(`    Amount: ${Number(parsed.amount) / 1e9} SUI`);
          if (parsed.timestamp)
            console.log(`    Time: ${new Date(Number(parsed.timestamp)).toLocaleString()}`);
        }
      });
    }
  } catch (error) {
    console.log('  Could not fetch events');
  }

  console.log(`\n🔗 Explorer: https://suiscan.xyz/${NETWORK}/object/${VAULT_ID}`);
  console.log('\n✨ Done!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
