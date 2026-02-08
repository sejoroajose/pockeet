#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NETWORK = process.env.SUI_NETWORK || 'testnet';
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
const VAULT_ID = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID;
const ADMIN_CAP_ID = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;

if (!PACKAGE_ID || !VAULT_ID || !ADMIN_CAP_ID) {
  console.error('❌ Missing environment variables');
  console.log('Required:');
  console.log('  NEXT_PUBLIC_PACKAGE_ID');
  console.log('  NEXT_PUBLIC_VAULT_OBJECT_ID');
  console.log('  NEXT_PUBLIC_ADMIN_CAP_ID');
  process.exit(1);
}

async function main() {
  console.log('💰 Simulating Yield Generation\n');
  console.log(`Network: ${NETWORK}`);
  console.log(`Vault: ${VAULT_ID}\n`);

  const address = execSync('sui client active-address', { encoding: 'utf8' }).trim();
  console.log(`Admin: ${address}\n`);

  console.log('📈 Generating yield with PTB...\n');
  
  try {
    // Object arguments need @ prefix to indicate they are object IDs
    const moveCallTarget = `"${PACKAGE_ID}::vault::simulate_yield<0x2::sui::SUI>"`;
    
    const ptbCommand = `sui client ptb --gas-budget 50000000 --split-coins gas [5000000] --assign yield_coin --move-call ${moveCallTarget} @${ADMIN_CAP_ID} @${VAULT_ID} yield_coin.0 --json`;

    const output = execSync(ptbCommand, { encoding: 'utf8' });
    
    const result = JSON.parse(output);
    const digest = result.digest || result.transaction?.digest;

    if (!result.effects?.status?.status || result.effects.status.status !== 'success') {
      console.error('❌ Failed:', result.effects?.status?.error);
      process.exit(1);
    }

    console.log('✅ Yield generated!\n');

    if (result.events && result.events.length > 0) {
      console.log('📊 Events:');
      for (const event of result.events) {
        if (event.parsedJson) {
          console.log(`  Strategy: ${event.parsedJson.strategy}`);
          console.log(`  Amount: ${Number(event.parsedJson.amount) / 1e9} SUI`);
        }
      }
    }

    console.log(`\n🔗 Transaction: ${digest}`);
    console.log(`📍 Explorer: https://suiscan.xyz/${NETWORK}/tx/${digest}\n`);
    console.log('✨ Check vault info with: yarn vault:info');
  } catch (error: any) {
    console.error('❌ Failed to simulate yield:', error.message);
    if (error.stdout) console.log('Output:', error.stdout);
    if (error.stderr) console.error('Error:', error.stderr);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});