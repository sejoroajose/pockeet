'use client';

import { useConnection } from 'wagmi';
import { useEffect } from 'react';

export function DebugConnection() {
  const { address, isConnected, chainId } = useConnection();

  useEffect(() => {
    console.log('🔍 Connection Debug:', {
      address,
      isConnected,
      chainId,
      timestamp: new Date().toISOString()
    });
  }, [address, isConnected, chainId]);

  return null;
}