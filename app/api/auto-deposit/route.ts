import { NextRequest, NextResponse } from 'next/server';
import { getSuiClient, executeTransaction, getKeypair } from '@/lib/sui/client';
import { buildDepositTx } from '@/lib/sui/ptb';

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
    const result = await client.core.listCoins({
      owner: userAddress,
      coinType,
    });

    console.log('listCoins result:', JSON.stringify(result, null, 2));

    const coins = (result as any).coins || [];
    if (coins.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No coins found on Sui yet. CCTP may still be processing.' },
        { status: 404 }
      );
    }

    const amountToDeposit = amount.toString();

    console.log('Building deposit transaction...');
    const tx = buildDepositTx({
      vaultId,
      packageId,
      coinType,
      amount: amountToDeposit,
      userAddress,
    });

    console.log('Executing deposit transaction...');
    const txDigest = await executeTransaction(tx, 'testnet');

    console.log('Auto-deposit successful:', txDigest);
    return NextResponse.json({
      success: true,
      txDigest,
      amount: amountToDeposit,
    });
  } catch (error) {
    console.error('Auto-deposit error:', error);
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