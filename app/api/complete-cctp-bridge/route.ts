import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { executeTransaction } from '@/lib/sui/client';

const MESSAGE_TRANSMITTER = process.env.NEXT_PUBLIC_SUI_MESSAGE_TRANSMITTER!;
const TOKEN_MESSENGER_MINTER = process.env.NEXT_PUBLIC_SUI_TOKEN_MESSENGER_MINTER!;
const USDC_TREASURY = process.env.NEXT_PUBLIC_SUI_USDC_TREASURY!;
const USDC_PACKAGE = process.env.NEXT_PUBLIC_USDC_PACKAGE_ID!;
const DENY_LIST = '0x403';

export async function POST(req: NextRequest) {
  try {
    const { message, attestation, userAddress } = await req.json();
    
    if (!message || !attestation || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters' },
        { status: 400 }
      );
    }

    console.log('Completing CCTP on Sui for:', userAddress);
    console.log('Attestation received, minting USDC on Sui...');
    
    // Build receive transaction
    const tx = new Transaction();
    
    // receive_message
    const [receipt] = tx.moveCall({
      target: `${MESSAGE_TRANSMITTER}::receive_message::receive_message`,
      arguments: [
        tx.pure.vector('u8', Array.from(Buffer.from(message.replace('0x', ''), 'hex'))),
        tx.pure.vector('u8', Array.from(Buffer.from(attestation.replace('0x', ''), 'hex'))),
        tx.object(MESSAGE_TRANSMITTER),
      ],
    });
    
    // handle_receive_message
    const [stampedTicket] = tx.moveCall({
      target: `${TOKEN_MESSENGER_MINTER}::handle_receive_message::handle_receive_message`,
      arguments: [
        receipt,
        tx.object(TOKEN_MESSENGER_MINTER),
        tx.object(DENY_LIST),
        tx.object(USDC_TREASURY),
      ],
      typeArguments: [`${USDC_PACKAGE}::usdc::USDC`],
    });
    
    // deconstruct
    const [ticket] = tx.moveCall({
      target: `${TOKEN_MESSENGER_MINTER}::handle_receive_message::deconstruct_stamp_receipt_ticket_with_burn_message`,
      arguments: [stampedTicket],
    });
    
    // stamp_receipt
    const [stamped] = tx.moveCall({
      target: `${MESSAGE_TRANSMITTER}::receive_message::stamp_receipt`,
      arguments: [
        ticket,
        tx.object(MESSAGE_TRANSMITTER),
      ],
      typeArguments: [`${TOKEN_MESSENGER_MINTER}::message_transmitter_authenticator::MessageTransmitterAuthenticator`],
    });
    
    // complete
    tx.moveCall({
      target: `${MESSAGE_TRANSMITTER}::receive_message::complete_receive_message`,
      arguments: [
        stamped,
        tx.object(MESSAGE_TRANSMITTER),
      ],
    });
    
    // Execute transaction
    const mintTxDigest = await executeTransaction(tx, 'testnet');
    
    console.log('USDC minted on Sui:', mintTxDigest);
    
    return NextResponse.json({
      success: true,
      mintTxDigest,
      message: 'USDC successfully minted on Sui',
    });
  } catch (error) {
    console.error('CCTP completion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to complete bridge',
      },
      { status: 500 }
    );
  }
}