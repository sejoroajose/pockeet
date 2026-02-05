#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Network configuration
const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';

interface DeploymentInfo {
  network: string;
  packageId: string;
  vaultId: string | null;
  adminCapId: string;
  digest: string;
  timestamp: string;
}

function extractJSON(output: string): any {
  const jsonStart = output.indexOf('{');
  if (jsonStart === -1) {
    throw new Error('No JSON found in output');
  }
  
  const jsonStr = output.substring(jsonStart);
  
  return JSON.parse(jsonStr);
}

async function main() {
  console.log('🚀 Starting pockeet deployment...\n');
  console.log(`Network: ${NETWORK}\n`);

  console.log('📍 Checking Sui CLI configuration...');
  try {
    const activeAddress = execSync('sui client active-address', { encoding: 'utf8' }).trim();
    console.log(`Deployer address: ${activeAddress}\n`);
  } catch (error: any) {
    console.error('❌ Error: Sui CLI not configured properly');
    console.log('Please run: sui client');
    process.exit(1);
  }

  // Check balance
  console.log('💰 Checking balance...');
  try {
    const balanceOutput = execSync('sui client gas', { encoding: 'utf8' });
    console.log(balanceOutput);
  } catch (error: any) {
    console.error('❌ Error checking balance');
    console.log('Get testnet SUI from: https://faucet.testnet.sui.io/');
  }

  // Build the package
  console.log('\n📦 Building package...');
  try {
    const buildOutput = execSync('sui move build', {
      cwd: path.join(__dirname, '..', 'sui'),
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
      `sui client publish --gas-budget 300000000 --json`,
      {
        cwd: path.join(__dirname, '..', 'sui'),
        encoding: 'utf8',
      }
    );

    // Extract JSON from the mixed output
    const publishResult = extractJSON(publishOutput);
    
    // Handle different response formats
    const effects = publishResult.effects || publishResult.objectChanges;
    const digest = publishResult.digest || publishResult.transaction?.digest;

    if (!digest) {
      console.error('❌ Could not find transaction digest in response');
      console.log('Response:', JSON.stringify(publishResult, null, 2));
      process.exit(1);
    }

    console.log(`✅ Package published!`);
    console.log(`Transaction: ${digest}\n`);

    // Extract package ID and admin cap from object changes
    let packageId: string | undefined;
    let adminCapId: string | undefined;

    // Try different response formats
    const objectChanges = publishResult.objectChanges || publishResult.effects?.created || [];
    
    for (const change of objectChanges) {
      // Check for published package
      if (change.type === 'published' || change.packageId) {
        packageId = change.packageId || change.objectId;
      }
      
      // Check for admin cap
      if (change.objectType?.includes('VaultAdminCap') || 
          change.type?.includes('VaultAdminCap')) {
        adminCapId = change.objectId;
      }
    }

    // Fallback: try parsing from created objects
    if (!packageId || !adminCapId) {
      const created = publishResult.effects?.created || [];
      for (const obj of created) {
        if (obj.owner === 'Immutable' || obj.reference?.objectId) {
          if (!packageId) packageId = obj.reference?.objectId;
        }
        if (obj.owner?.AddressOwner || obj.owner?.ObjectOwner) {
          if (obj.objectType?.includes('VaultAdminCap')) {
            adminCapId = obj.reference?.objectId;
          }
        }
      }
    }

    if (!packageId) {
      console.error('❌ Package ID not found in transaction result');
      console.log('Full response:', JSON.stringify(publishResult, null, 2));
      process.exit(1);
    }

    console.log('\n✅ Deployment successful!\n');
    console.log('📋 Deployment Details:');
    console.log(`Package ID: ${packageId}`);
    console.log(`Admin Cap ID: ${adminCapId || 'N/A'}`);
    console.log(`Transaction: ${digest}`);
    console.log(`Explorer: https://suiscan.xyz/${NETWORK}/tx/${digest}`);

    // Save deployment info
    const deploymentInfo: DeploymentInfo = {
      network: NETWORK,
      packageId,
      vaultId: null,
      adminCapId: adminCapId || '',
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
    if (adminCapId) {
      console.log(`NEXT_PUBLIC_ADMIN_CAP_ID=${adminCapId}`);
    }

    console.log('\n✨ Deployment complete!');
    console.log(`\nDeployment info saved to: ${deploymentFile}`);
    console.log('\nNext steps:');
    console.log('1. Update your .env.local with the package ID and admin cap ID');
    console.log('2. Run the create-vault script to create a vault');
    console.log('3. Test deposits and withdrawals');

    return deploymentInfo;
  } catch (error: any) {
    console.error('❌ Deployment failed:', error.message);
    if (error.stdout) {
      console.log('Output:', error.stdout);
    }
    if (error.stderr) {
      console.error('Error output:', error.stderr);
    }
    process.exit(1);
  }
}

// Run deployment
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});