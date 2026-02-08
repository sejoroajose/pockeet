import { NextRequest, NextResponse } from 'next/server';
import { executeTransaction } from '@/lib/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bridgeSuiToArc } from '@/lib/arc/cctp-sui-to-arc';

export async function POST(req: NextRequest) {
  try {
    const { ownerAddress, amount, recipientAddress, destinationChainId } = await req.json();
    
    if (!ownerAddress || !amount || !recipientAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters' },
        { status: 400 }
      );
    }

    const vaultId = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID!;
    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
    const coinType = '0x2::sui::SUI';
    
    console.log('Relayer withdrawal:', { ownerAddress, amount, recipientAddress, destinationChainId });

    // Build withdrawal transaction (relayer signs, user's balance deducted)
    const tx = new Transaction();
    
    // Call withdraw_to (requires updated contract)
    tx.moveCall({
      target: `${packageId}::vault::withdraw_to`,
      arguments: [
        tx.object(vaultId),
        tx.pure.address(ownerAddress),     // owner (whose balance to deduct)
        tx.pure.address(recipientAddress), // recipient (where to send coins)
        tx.pure.u64(amount),
      ],
      typeArguments: [coinType],
    });

    console.log('Executing relayer withdrawal...');
    const withdrawTxHash = await executeTransaction(tx, 'testnet');

    console.log('Withdrawal successful:', withdrawTxHash);

    let bridgeTxHash = null;

    // If bridge requested, trigger CCTP
    if (destinationChainId) {
      try {
        console.log('Initiating bridge to chain:', destinationChainId);
        
        // Convert amount back to USDC (assuming 1:1 for demo)
        const amountUsdc = (Number(amount) / 1_000_000_000 * 1_000_000).toString();
        
        const bridgeResult = await bridgeSuiToArc(
          amountUsdc,
          recipientAddress,
          'testnet'
        );
        
        bridgeTxHash = bridgeResult.txDigest;
        console.log('Bridge initiated:', bridgeTxHash);
      } catch (bridgeError) {
        console.error('Bridge failed:', bridgeError);
        // Don't fail the withdrawal if bridge fails
      }
    }

    return NextResponse.json({
      success: true,
      withdrawTxHash,
      bridgeTxHash,
      message: bridgeTxHash 
        ? 'Withdrawal complete, bridge in progress' 
        : 'Withdrawal complete',
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}