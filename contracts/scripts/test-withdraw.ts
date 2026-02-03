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

// Default test amount: 0.005 SUI in MIST
const AMOUNT = process.env.WITHDRAW_AMOUNT || '5000000';

if (!PACKAGE_ID || !VAULT_ID || !PRIVATE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.log('Required: NEXT_PUBLIC_PACKAGE_ID, NEXT_PUBLIC_VAULT_OBJECT_ID, SUI_PRIVATE_KEY');
  process.exit(1);
}

const packageId  = PACKAGE_ID  as string;
const vaultId    = VAULT_ID    as string;
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

function decodeWithdrawEvent(bcs: Uint8Array) {
  return {
    user:        bytesToHex(bcs.slice(0, 32)),
    amount:      readU64LE(bcs, 32),
    new_balance: readU64LE(bcs, 40),
  };
}


async function main() {
  console.log('🏦 Testing Vault Withdrawal...\n');

  const client = new SuiGrpcClient({
    baseUrl: RPC_URL,
    network: NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet',
  });

  const keypair = Ed25519Keypair.fromSecretKey(
    fromBase64(privateKey.replace(/^suiprivkey/, ''))
  );
  const address = keypair.toSuiAddress();

  console.log(`Withdrawer: ${address}`);
  console.log(`Amount: ${Number(AMOUNT) / 1e9} SUI\n`);

  // Pre-check: vault balance for this user
  console.log('🔍 Checking vault balance...');
  try {
    const { object: vault } = await client.getObject({
      objectId: vaultId,
      include: { json: true },
    });

    const fields = vault.json;
    if (fields) {
      const balancesTableId = (
        fields.balances as { fields?: { id?: { id?: string } } }
      )?.fields?.id?.id;

      if (balancesTableId) {
        try {
          // DynamicFieldName is { type: string, bcs: Uint8Array }.
          // BCS for address = raw 32 bytes.
          const { dynamicField } = await client.getDynamicField({
            parentId: balancesTableId,
            name: {
              type: 'address',
              bcs: hexToBytes(address),
            },
          });

          // dynamicField.value.bcs is a u64 — 8 bytes LE
          const currentBalance = readU64LE(dynamicField.value.bcs, 0);
          console.log(`Current vault balance: ${Number(currentBalance) / 1e9} SUI\n`);

          if (Number(currentBalance) < Number(AMOUNT)) {
            console.error('❌ Insufficient vault balance');
            console.log(`You have:            ${Number(currentBalance) / 1e9} SUI`);
            console.log(`Trying to withdraw:  ${Number(AMOUNT) / 1e9} SUI`);
            process.exit(1);
          }
        } catch {
          console.log('No deposits found for this address\n');
        }
      }
    }
  } catch {
    console.log('Could not fetch vault balance');
  }

  // Wallet balance before
  const { balance: balBefore } = await client.getBalance({ owner: address });
  console.log(`Wallet balance before: ${Number(balBefore.balance) / 1e9} SUI`);

  // Build transaction
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::vault::withdraw`,
    arguments: [tx.object(vaultId), tx.pure.u64(AMOUNT)],
    typeArguments: ['0x2::sui::SUI'],
  });

  // Execute
  console.log('\n📤 Withdrawing...');
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
    console.error('❌ Withdrawal failed:', executed.effects.status.error);
    process.exit(1);
  }

  console.log('✅ Withdrawal successful!\n');

  // Events
  if (executed.events && executed.events.length > 0) {
    console.log('📊 Events:');
    for (const event of executed.events) {
      if (event.eventType.includes('WithdrawEvent')) {
        const { user, amount, new_balance } = decodeWithdrawEvent(event.bcs);
        console.log(`  User:              ${user}`);
        console.log(`  Amount:            ${Number(amount) / 1e9} SUI`);
        console.log(`  Remaining Balance: ${Number(new_balance) / 1e9} SUI`);
      }
    }
  }

  // Wallet balance after
  const { balance: balAfter } = await client.getBalance({ owner: address });
  console.log(`\nWallet balance after: ${Number(balAfter.balance) / 1e9} SUI`);
  console.log(
    `Received: ${(Number(balAfter.balance) - Number(balBefore.balance)) / 1e9} SUI`
  );

  console.log(`\nTransaction: ${executed.digest}`);
  console.log(`Explorer: https://suiscan.xyz/${NETWORK}/tx/${executed.digest}`);

  console.log('\n✨ Test complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});