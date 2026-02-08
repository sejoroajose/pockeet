import { NextRequest, NextResponse } from 'next/server';
import { getSuiClient, executeTransaction, getKeypair } from '@/lib/sui/client';
import { Transaction } from '@mysten/sui/transactions';

export async function POST(req: NextRequest) {
  try {
    const { userAddress, amount } = await req.json();
    
    if (!userAddress || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters' },
        { status: 400 }
      );
    }

    const vaultId = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID!;
    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
    const coinType = '0x2::sui::SUI';
    
    console.log('Auto-deposit request:', { userAddress, amount, vaultId });
    
    const client = getSuiClient('testnet');
    const coins = await client.listCoins({
      owner: userAddress,
      coinType,
    });

    if (!coins) {
      return NextResponse.json(
        { success: false, error: 'No coins found on Sui yet.' },
        { status: 404 }
      );
    }

    // Build transaction with SERVER as signer but USER as beneficiary
    const tx = new Transaction();
    
    // Split coin from gas
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    // Call deposit with beneficiary parameter
    tx.moveCall({
      target: `${packageId}::vault::deposit`,
      arguments: [
        tx.object(vaultId),
        coin,
        tx.pure.address(userAddress), //  BENEFICIARY = USER
      ],
      typeArguments: [coinType],
    });

    console.log('Executing deposit for user:', userAddress);
    const txDigest = await executeTransaction(tx, 'testnet');

    console.log('Auto-deposit successful:', txDigest);
    
    // Trigger yield simulation
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/simulate-yield`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId }),
      });
    } catch (yieldError) {
      console.error('Yield simulation failed:', yieldError);
    }

    return NextResponse.json({
      success: true,
      txDigest,
      amount,
    });
  } catch (error) {
    console.error('Auto-deposit error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}