#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';

// Network configuration
const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
const RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';

// Get private key from environment
const PRIVATE_KEY = process.env.NEXT_PUBLIC_SUI_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Error: SUI_PRIVATE_KEY environment variable is not set');
  console.log('Usage: SUI_PRIVATE_KEY=your_private_key pnpm deploy');
  process.exit(1);
}

interface DeploymentInfo {
  network: string;
  packageId: string;
  vaultId: string | null;
  adminCapId: string;
  digest: string;
  timestamp: string;
}

async function main() {
  console.log('🚀 Starting pockeet deployment...\n');
  console.log(`Network: ${NETWORK}`);
  console.log(`RPC: ${RPC_URL}\n`);

  // Initialize client and keypair
  const client = new SuiGrpcClient({ 
    baseUrl: RPC_URL,
    network: NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet'
  });
  const privateKeyBase64 = PRIVATE_KEY!.replace('suiprivkey', '');
  const keypair = Ed25519Keypair.fromSecretKey(fromBase64(privateKeyBase64));
  const address = keypair.toSuiAddress();

  console.log(`Deployer address: ${address}\n`);

  // Check balance
  // GetBalanceResponse → { balance: Balance }
  // Balance            → { coinType, balance, coinBalance, addressBalance }
  const { balance: suiBalance } = await client.getBalance({ owner: address });
  console.log(`Balance: ${Number(suiBalance.balance) / 1e9} SUI\n`);

  if (Number(suiBalance.balance) === 0) {
    console.error('❌ Error: Insufficient balance for deployment');
    console.log('Get testnet SUI from: https://faucet.testnet.sui.io/');
    process.exit(1);
  }

  // Build the package
  console.log('📦 Building package...');
  try {
    const buildOutput = execSync('sui move build', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    console.log(buildOutput);
    console.log('✅ Package built successfully\n');
  } catch (error: any) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }

  // Publish the package
  console.log('📤 Publishing package...');
  try {
    const publishOutput = execSync(
      `sui client publish --gas-budget 500000000 --json`,
      {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        env: {
          ...process.env,
          SUI_CONFIG_DIR: process.env.HOME + '/.sui/sui_config',
        },
      }
    );

    const publishResult = JSON.parse(publishOutput);
    const digest = publishResult.digest;

    console.log(`✅ Package published!`);
    console.log(`Transaction: ${digest}\n`);

    // Wait for transaction
    // WaitForTransactionByDigest extends GetTransactionOptions: { digest, include?, timeout? }
    // TransactionInclude: { effects?, objectTypes?, balanceChanges?, events?, transaction?, bcs? }
    console.log('⏳ Waiting for transaction confirmation...');
    const txResponse = await client.waitForTransaction({
      digest,
      include: {
        effects: true,      // gives us effects.changedObjects
        objectTypes: true,  // gives us objectTypes: Record<objectId, fullTypeName>
      },
    });

    // TransactionResult is a discriminated union — unwrap first
    const tx = txResponse.Transaction ?? txResponse.FailedTransaction;

    if (!tx.effects.status.success) {
      throw new Error(`Transaction failed: ${JSON.stringify(tx.effects.status.error)}`);
    }

    // effects.changedObjects: ChangedObject[]
    //   .objectId      — the ID
    //   .outputState   — 'PackageWrite' for a published package, 'ObjectWrite' for regular objects
    //   .idOperation   — 'Created' | 'Deleted' | 'None' | 'Unknown'
    // tx.objectTypes   — Record<string, string>: objectId → full Move type (e.g. "0xpkg::vault::VaultAdminCap")
    const changedObjects = tx.effects.changedObjects;
    const objectTypes    = tx.objectTypes;

    // Published package: the only ChangedObject with outputState === 'PackageWrite'
    const packageId = changedObjects.find(
      (obj) => obj.outputState === 'PackageWrite' && obj.idOperation === 'Created'
    )?.objectId;

    // AdminCap: newly created object whose type (from objectTypes map) contains 'VaultAdminCap'
    const adminCap = changedObjects.find(
      (obj) =>
        obj.idOperation === 'Created' &&
        objectTypes?.[obj.objectId]?.includes('VaultAdminCap')
    );

    if (!packageId) {
      throw new Error('Package ID not found in transaction result');
    }

    console.log('\n✅ Deployment successful!\n');
    console.log('📋 Deployment Details:');
    console.log(`Package ID: ${packageId}`);
    console.log(`Admin Cap ID: ${adminCap?.objectId || 'N/A'}`);
    console.log(`Transaction: ${digest}`);

    // Save deployment info
    const deploymentInfo: DeploymentInfo = {
      network: NETWORK,
      packageId,
      vaultId: null,
      adminCapId: adminCap?.objectId || '',
      digest,
      timestamp: new Date().toISOString(),
    };

    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(
      deploymentsDir,
      `${NETWORK}-${Date.now()}.json`
    );
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    // Update .env.local template
    console.log('\n📝 Environment Variables:');
    console.log(`NEXT_PUBLIC_PACKAGE_ID=${packageId}`);
    console.log(`NEXT_PUBLIC_ADMIN_CAP_ID=${adminCap?.objectId || ''}`);

    console.log('\n✨ Deployment complete!');
    console.log(`\nDeployment info saved to: ${deploymentFile}`);
    console.log('\nNext steps:');
    console.log('1. Update your .env.local with the package ID');
    console.log('2. Run the create-vault script to create a vault');
    console.log('3. Test deposits and withdrawals');

    return deploymentInfo;
  } catch (error: any) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});