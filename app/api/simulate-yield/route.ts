import { NextRequest, NextResponse } from 'next/server';
import { getSuiClient, executeTransaction, getKeypair } from '@/lib/sui/client';
import { Transaction } from '@mysten/sui/transactions';

export async function POST(req: NextRequest) {
  try {
    const { vaultId } = await req.json();
    
    if (!vaultId) {
      return NextResponse.json(
        { success: false, error: 'Missing vault ID' },
        { status: 400 }
      );
    }

    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
    const adminCapId = process.env.NEXT_PUBLIC_ADMIN_CAP_ID!;
    
    console.log('Simulating yield for vault:', vaultId);

    // Build PTB for yield simulation
    const tx = new Transaction();
    
    // Split 5 SUI (5_000_000 MIST) for yield
    const [yieldCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(5_000_000)]);
    
    // Call simulate_yield function
    tx.moveCall({
      target: `${packageId}::vault::simulate_yield`,
      arguments: [
        tx.object(adminCapId),
        tx.object(vaultId),
        yieldCoin,
      ],
      typeArguments: ['0x2::sui::SUI'],
    });

    // Execute transaction
    console.log('Executing yield simulation transaction...');
    const txDigest = await executeTransaction(tx, 'testnet');

    console.log('Yield simulation successful:', txDigest);
    return NextResponse.json({
      success: true,
      txDigest,
      message: 'Yield generated successfully',
    });
  } catch (error) {
    console.error('Yield simulation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}