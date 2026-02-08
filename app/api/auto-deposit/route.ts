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
    const coinType = `${packageId}::usdc::USDC`;
    
    const client = getSuiClient('testnet');
    const result = await client.core.listCoins({
      owner: userAddress,
      coinType,
    });

    const coins = (result as any).coins || [];
    if (coins.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No USDC coins found' },
        { status: 404 }
      );
    }

    const amountToDeposit = amount.toString();

    const tx = buildDepositTx({
      vaultId,
      packageId,
      coinType,
      amount: amountToDeposit,
      userAddress,
    });

    const txDigest = await executeTransaction(tx, 'testnet');

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
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}