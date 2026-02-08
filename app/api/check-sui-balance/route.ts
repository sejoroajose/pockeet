import { NextRequest, NextResponse } from 'next/server';
import { getSuiClient } from '@/lib/sui/client';

export async function POST(req: NextRequest) {
  try {
    const { userAddress } = await req.json();
    
    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing userAddress' },
        { status: 400 }
      );
    }

    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
    const coinType = `${packageId}::usdc::USDC`;
    
    const client = getSuiClient('testnet');
    
    const result = await client.core.listCoins({
      owner: userAddress,
      coinType,
    });

    const coins = (result as any).coins || [];
    
    if (coins.length === 0) {
      return NextResponse.json({
        success: true,
        hasUSDC: false,
        balance: 0,
        formattedBalance: '0.00',
      });
    }

    const totalBalance = coins.reduce((sum: bigint, coin: any) => {
      return sum + BigInt(coin.balance);
    }, 0n);

    const formattedBalance = (Number(totalBalance) / 1_000_000).toFixed(2);

    return NextResponse.json({
      success: true,
      hasUSDC: true,
      balance: totalBalance.toString(),
      formattedBalance,
      coinCount: coins.length,
    });
  } catch (error) {
    console.error('Check balance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}