import { type Address, type Hash, parseUnits, erc20Abi, createPublicClient, http, fallback, decodeEventLog, keccak256 } from 'viem';
import type { WalletClient } from 'viem';
import { type CCTPChainConfig, SUI_DOMAIN } from '../arc/chains';

const TOKEN_MESSENGER_ABI = [
  {
    name: 'depositForBurn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
    ],
    outputs: [{ name: 'nonce', type: 'uint64' }],
  },
  {
    type: 'event',
    name: 'MessageSent',
    inputs: [
      {
        indexed: false,
        internalType: 'bytes',
        name: 'message',
        type: 'bytes',
      },
    ],
  },
] as const;

const MESSAGE_SENT_TOPIC = '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036' as const;

export interface BridgeResult {
  burnTxHash: Hash;
  amount: string;
  recipient: string;
  sourceChain: string;
  message: `0x${string}`;
  messageHash: `0x${string}`;
}

export async function bridgeToSui(
  walletClient: WalletClient,
  sourceChain: CCTPChainConfig,
  amount: string,
  suiRecipient: string
): Promise<BridgeResult> {
  if (!walletClient.account) {
    throw new Error('No wallet account connected');
  }

  const amountWei = parseUnits(amount, 6);
  const recipientBytes32 = suiAddressToBytes32(suiRecipient);

  const publicClient = createPublicClient({
    chain: sourceChain.chain,
    transport: fallback([
      http(sourceChain.rpcUrl),
      http(), 
    ], {
      rank: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  });

  // 1. Approve TokenMessenger
  console.log('Simulating approval...');
  const { request: approveRequest } = await publicClient.simulateContract({
    address: sourceChain.usdcAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [sourceChain.tokenMessenger, amountWei],
    account: walletClient.account,
  });

  console.log('Sending approval transaction...');
  const approveTx = await walletClient.writeContract(approveRequest);
  
  console.log('Waiting for approval confirmation...');
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log('Approval confirmed:', approveTx);

  // 2. Burn tokens
  console.log('Simulating burn...');
  const { request: burnRequest } = await publicClient.simulateContract({
    address: sourceChain.tokenMessenger,
    abi: TOKEN_MESSENGER_ABI,
    functionName: 'depositForBurn',
    args: [amountWei, SUI_DOMAIN, recipientBytes32, sourceChain.usdcAddress],
    account: walletClient.account,
  });

  console.log('Sending burn transaction...');
  const burnTxHash = await walletClient.writeContract(burnRequest);
  
  console.log('Waiting for burn confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash: burnTxHash });
  console.log('Burn confirmed:', burnTxHash);

  // Find the MessageSent event emitted by the MessageTransmitter contract
  const messageLog = receipt.logs.find(
    (log) =>
      log.address.toLowerCase() === sourceChain.messageTransmitter.toLowerCase() &&
      log.topics[0] === MESSAGE_SENT_TOPIC
  );

  if (!messageLog) {
    throw new Error('MessageSent event not found in burn transaction receipt');
  }

  const { args } = decodeEventLog({
    abi: TOKEN_MESSENGER_ABI,
    eventName: 'MessageSent',
    topics: messageLog.topics,
    data: messageLog.data,
  }) as { args: { message: `0x${string}` } };

  const message = args.message;
  const messageHash = keccak256(message);

  return {
    burnTxHash,
    amount,
    recipient: suiRecipient,
    sourceChain: sourceChain.chain.name,
    message,
    messageHash,
  };
}

function suiAddressToBytes32(suiAddress: string): `0x${string}` {
  const cleanAddress = suiAddress.replace('0x', '');
  const paddedAddress = cleanAddress.padStart(64, '0');
  return `0x${paddedAddress}`;
}