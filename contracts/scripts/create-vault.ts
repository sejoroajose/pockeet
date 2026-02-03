#!/usr/bin/env ts-node

import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import * as fs from 'fs';
import * as path from 'path';

const NETWORK = process.env.SUI_NETWORK || 'testnet';
const RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
const ADMIN_CAP_ID = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;
const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;

if (!PACKAGE_ID || !ADMIN_CAP_ID || !PRIVATE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.log('Required:');
  console.log('  - NEXT_PUBLIC_PACKAGE_ID');
  console.log('  - NEXT_PUBLIC_ADMIN_CAP_ID');
  console.log('  - SUI_PRIVATE_KEY');
  process.exit(1);
}

const packageId  = PACKAGE_ID  as string;
const adminCapId = ADMIN_CAP_ID as string;
const privateKey = PRIVATE_KEY  as string;

async function main() {
  console.log('🏦 Creating CrossVault...\n');
  console.log(`Network: ${NETWORK}`);
  console.log(`Package: ${packageId}\n`);

  // Initialize
  const client = new SuiGrpcClient({ 
      baseUrl: RPC_URL,
      network: NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet'
    });
  const privateKeyBase64 = privateKey.replace('suiprivkey', '');
  const keypair = Ed25519Keypair.fromSecretKey(fromBase64(privateKeyBase64));
  const address = keypair.toSuiAddress();

  console.log(`Creator: ${address}\n`);

  // Create transaction
  const tx = new Transaction();

  // Call create_vault function
  tx.moveCall({
    target: `${packageId}::vault::create_vault`,
    arguments: [tx.object(adminCapId)],
    typeArguments: ['0x2::sui::SUI'], // Change this to USDC type when ready
  });

  console.log('📤 Creating vault...');
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    include: {
      effects: true,      
      objectTypes: true,  
    },
  });

  // TransactionResult is a discriminated union — unwrap first
  const executed = result.Transaction ?? result.FailedTransaction;

  if (!executed.effects.status.success) {
    console.error('❌ Transaction failed:', executed.effects.status.error);
    process.exit(1);
  }

  console.log('✅ Vault created successfully!\n');


  const changedObjects = executed.effects.changedObjects;
  const objectTypes    = executed.objectTypes;

  const vaultObject = changedObjects.find(
    (obj) =>
      obj.idOperation === 'Created' &&
      objectTypes?.[obj.objectId]?.includes('Vault') &&
      !objectTypes?.[obj.objectId]?.includes('AdminCap')
  );

  if (!vaultObject) {
    console.error('❌ Could not find vault object in transaction result');
    process.exit(1);
  }

  const vaultId = vaultObject.objectId;

  console.log('📋 Vault Details:');
  console.log(`Vault ID: ${vaultId}`);
  console.log(`Transaction: ${executed.digest}`);
  console.log(`Explorer: https://suiscan.xyz/${NETWORK}/tx/${executed.digest}\n`);

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
  console.log('1. Test deposits with: pnpm test:deposit');
  console.log('2. Check vault info with: pnpm vault:info');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});