#!/usr/bin/env ts-node

import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

const NETWORK  = process.env.SUI_NETWORK || 'testnet';
const RPC_URL  = process.env.SUI_RPC_URL  || 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
const VAULT_ID   = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID;
const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;

// Default test amount: 0.01 SUI in MIST
const AMOUNT = process.env.DEPOSIT_AMOUNT || '10000000';

if (!PACKAGE_ID || !VAULT_ID || !PRIVATE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.log('Required: NEXT_PUBLIC_PACKAGE_ID, NEXT_PUBLIC_VAULT_OBJECT_ID, SUI_PRIVATE_KEY');
  process.exit(1);
}

// process.exit() doesn't narrow — capture definite strings here
const packageId = PACKAGE_ID  as string;
const vaultId   = VAULT_ID    as string;
const privateKey = PRIVATE_KEY as string;

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

// Assumes: struct DepositEvent { user: address, amount: u64, new_balance: u64 }
// Update field order here if your Move struct differs.
function decodeDepositEvent(bcs: Uint8Array) {
  return {
    user:        bytesToHex(bcs.slice(0, 32)),
    amount:      readU64LE(bcs, 32),
    new_balance: readU64LE(bcs, 40),
  };
}


async function main() {
  console.log('💰 Testing Vault Deposit...\n');

  const client = new SuiGrpcClient({
    baseUrl: RPC_URL,
    network: NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet',
  });

  const keypair = Ed25519Keypair.fromSecretKey(
    fromBase64(privateKey.replace(/^suiprivkey/, ''))
  );
  const address = keypair.toSuiAddress();

  console.log(`Depositor: ${address}`);
  console.log(`Amount: ${Number(AMOUNT) / 1e9} SUI\n`);

  // Check balance before
  // GetBalanceResponse → { balance: Balance }
  // Balance            → { coinType, balance, coinBalance, addressBalance }
  const { balance: balBefore } = await client.getBalance({ owner: address });
  console.log(`Balance before: ${Number(balBefore.balance) / 1e9} SUI`);

  // Build transaction
  const tx = new Transaction();

  // splitCoins expects amounts as tx.pure.u64() or plain numbers — not raw strings
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(AMOUNT)]);

  tx.moveCall({
    target: `${packageId}::vault::deposit`,
    arguments: [tx.object(vaultId), coin],
    typeArguments: ['0x2::sui::SUI'],
  });

  // Execute
  console.log('\n📤 Depositing...');
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    include: {
      effects: true,
      events:  true,
    },
  });

  // TransactionResult is a discriminated union — unwrap first
  const executed = result.Transaction ?? result.FailedTransaction;

  if (!executed.effects.status.success) {
    console.error('❌ Deposit failed:', executed.effects.status.error);
    process.exit(1);
  }

  console.log('✅ Deposit successful!\n');

  // Events
  if (executed.events && executed.events.length > 0) {
    console.log('📊 Events:');
    for (const event of executed.events) {
      if (event.eventType.includes('DepositEvent')) {
        const { user, amount, new_balance } = decodeDepositEvent(event.bcs);
        console.log(`  User:        ${user}`);
        console.log(`  Amount:      ${Number(amount) / 1e9} SUI`);
        console.log(`  New Balance: ${Number(new_balance) / 1e9} SUI`);
      }
    }
  }

  // Check balance after
  const { balance: balAfter } = await client.getBalance({ owner: address });
  console.log(`\nBalance after: ${Number(balAfter.balance) / 1e9} SUI`);

  console.log(`\nTransaction: ${executed.digest}`);
  console.log(`Explorer: https://suiscan.xyz/${NETWORK}/tx/${executed.digest}`);

  // Vault status
  console.log('\n🔍 Fetching vault info...');
  try {
    const { object: vault } = await client.getObject({
      objectId: vaultId,
      include: { json: true },
    });

    const fields = vault.json;
    if (fields) {
      console.log('\n📦 Vault Status:');
      console.log(`  Total Deposited: ${Number(fields.total_deposited as string) / 1e9} SUI`);
      console.log(`  Yield Earned:    ${Number(fields.yield_balance  as string) / 1e9} SUI`);
      console.log(`  Paused:          ${fields.paused}`);
    }
  } catch {
    console.log('Could not fetch vault details');
  }

  console.log('\n✨ Test complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});