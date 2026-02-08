import { NextRequest, NextResponse } from 'next/server';
import { bridgeSuiToArc } from '@/lib/arc/cctp-sui-to-arc';

export async function POST(req: NextRequest) {
  try {
    const { amount, recipientAddress, destinationChainId } = await req.json();
    
    if (!amount || !recipientAddress || !destinationChainId) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters' },
        { status: 400 }
      );
    }

    console.log('Bridging from Sui to EVM:', {
      amount,
      recipientAddress,
      destinationChainId,
    });

    // Convert amount to USDC wei (6 decimals)
    const amountWei = (amount * 1_000_000).toString();

    // Bridge using CCTP
    const result = await bridgeSuiToArc(amountWei, recipientAddress, 'testnet');

    console.log('Bridge successful:', result.txDigest);

    return NextResponse.json({
      success: true,
      txDigest: result.txDigest,
      amount: result.amount,
      recipient: result.recipient,
    });
  } catch (error) {
    console.error('Bridge error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bridge failed',
      },
      { status: 500 }
    );
  }
}