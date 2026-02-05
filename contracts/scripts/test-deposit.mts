#!/usr/bin/env ts-node

import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NETWORK = process.env.SUI_NETWORK || 'testnet';
const RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
const VAULT_ID = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID;
const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;

// Default test amount: 0.01 SUI in MIST
const AMOUNT = process.env.DEPOSIT_AMOUNT || '10000000';

if (!PACKAGE_ID || !VAULT_ID || !PRIVATE_KEY) {
  console.error('❌ Missing environment variables');
  console.log('Required:');
  console.log('  NEXT_PUBLIC_PACKAGE_ID');
  console.log('  NEXT_PUBLIC_VAULT_OBJECT_ID');
  console.log('  SUI_PRIVATE_KEY');
  process.exit(1);
}

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

function decodeDepositEvent(bcs: Uint8Array) {
  return {
    user: bytesToHex(bcs.slice(0, 32)),
    amount: readU64LE(bcs, 32),
    new_balance: readU64LE(bcs, 40),
  };
}

async function main() {
  console.log('💰 Testing Vault Deposit\n');
  console.log(`Network: ${NETWORK}`);
  console.log(`Package: ${PACKAGE_ID}`);
  console.log(`Vault: ${VAULT_ID}\n`);

  const client = new SuiGrpcClient({
    baseUrl: RPC_URL,
    network: NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet',
  });

  // Decode the private key properly
  const { secretKey } = decodeSuiPrivateKey(PRIVATE_KEY!);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  const address = keypair.toSuiAddress();

  console.log(`Depositor: ${address}`);
  console.log(`Amount: ${Number(AMOUNT) / 1e9} SUI\n`);

  // Check balance
  const { balance: balBefore } = await client.getBalance({ owner: address });
  console.log(`Balance before: ${Number(balBefore.balance) / 1e9} SUI`);

  if (Number(balBefore.balance) < Number(AMOUNT) + 50000000) {
    console.error('\n❌ Insufficient balance');
    console.log('Get testnet SUI: https://faucet.testnet.sui.io/');
    process.exit(1);
  }

  // Build transaction
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(AMOUNT)]);

  tx.moveCall({
    target: `${PACKAGE_ID}::vault::deposit`,
    arguments: [tx.object(VAULT_ID!), coin],
    typeArguments: ['0x2::sui::SUI'],
  });

  // Execute
  console.log('\n📤 Depositing...');
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    include: {
      effects: true,
      events: true,
    },
  });

  const executed = result.Transaction ?? result.FailedTransaction;

  if (!executed.effects.status.success) {
    console.error('❌ Failed:', executed.effects.status.error);
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

  console.log(`\n🔗 Transaction: ${executed.digest}`);
  console.log(`📍 Explorer: https://suiscan.xyz/${NETWORK}/tx/${executed.digest}`);

  console.log('\n✨ Test complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});