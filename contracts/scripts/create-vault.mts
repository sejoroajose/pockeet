#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NETWORK = process.env.SUI_NETWORK || 'testnet';
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
const ADMIN_CAP_ID = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;

if (!PACKAGE_ID || !ADMIN_CAP_ID) {
  console.error('❌ Error: Missing required environment variables');
  console.log('Required:');
  console.log('  - NEXT_PUBLIC_PACKAGE_ID');
  console.log('  - NEXT_PUBLIC_ADMIN_CAP_ID');
  process.exit(1);
}

const packageId = PACKAGE_ID as string;
const adminCapId = ADMIN_CAP_ID as string;

async function main() {
  console.log('🏦 Creating Vault...\n');
  console.log(`Network: ${NETWORK}`);
  console.log(`Package: ${packageId}\n`);

  // Get active address
  const address = execSync('sui client active-address', { encoding: 'utf8' }).trim();
  console.log(`Creator: ${address}\n`);

  // Create the Move call
  console.log('📤 Creating vault...');
  
  const moveCall = [
    'sui', 'client', 'call',
    '--package', packageId,
    '--module', 'vault',
    '--function', 'create_vault',
    '--args', adminCapId,
    '--type-args', '0x2::sui::SUI',
    '--gas-budget', '100000000',
    '--json'
  ].join(' ');

  try {
    const output = execSync(moveCall, {
      encoding: 'utf8',
    });

    const result = JSON.parse(output);
    const digest = result.digest || result.transaction?.digest;

    if (!result.effects?.status?.status || result.effects.status.status !== 'success') {
      console.error('❌ Transaction failed:', result.effects?.status?.error);
      process.exit(1);
    }

    console.log('✅ Vault created successfully!\n');

    // Find vault object ID from created objects
    let vaultId: string | undefined;
    const created = result.objectChanges || result.effects?.created || [];
    
    for (const obj of created) {
      if (obj.objectType?.includes('Vault') && 
          !obj.objectType?.includes('AdminCap')) {
        vaultId = obj.objectId;
        break;
      }
    }

    if (!vaultId) {
      console.error('❌ Could not find vault object in transaction result');
      console.log('Created objects:', JSON.stringify(created, null, 2));
      process.exit(1);
    }

    console.log('📋 Vault Details:');
    console.log(`Vault ID: ${vaultId}`);
    console.log(`Transaction: ${digest}`);
    console.log(`Explorer: https://suiscan.xyz/${NETWORK}/tx/${digest}\n`);

    // Update deployment info
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    const files = fs.readdirSync(deploymentsDir).filter((f) => f.startsWith(NETWORK));

    if (files.length > 0) {
      const latestFile = files.sort().reverse()[0];
      const deploymentPath = path.join(deploymentsDir, latestFile);
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

      deployment.vaultId = vaultId;
      deployment.vaultCreatedAt = new Date().toISOString();

      fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
      console.log(`✅ Updated deployment file: ${latestFile}\n`);
    }

    // Environment variable
    console.log('📝 Add to your .env.local:');
    console.log(`NEXT_PUBLIC_VAULT_OBJECT_ID=${vaultId}\n`);

    console.log('✨ Vault setup complete!');
    console.log('\nYou can now:');
    console.log('1. Test deposits with: yarn test:deposit');
    console.log('2. Check vault info with: yarn vault:info');
  } catch (error: any) {
    console.error('❌ Failed to create vault:', error.message);
    if (error.stdout) console.log('Output:', error.stdout);
    if (error.stderr) console.error('Error:', error.stderr);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});