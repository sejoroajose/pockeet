'use client';

import { useENS } from '@/lib/ens/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

export function ENSDisplay({ address }: { address?: string }) {
  const { ensName, avatar, loading } = useENS(address);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full" />
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (!address) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
      <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
        {avatar ? (
          <AvatarImage src={avatar} alt={ensName || address} />
        ) : null}
        <AvatarFallback>
          {ensName ? ensName[0].toUpperCase() : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col">
        {ensName ? (
          <>
            <span className="text-sm font-semibold text-gray-900">{ensName}</span>
            <span className="text-xs text-gray-500 font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </>
        ) : (
          <span className="text-sm font-mono text-gray-700">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>
    </div>
  );
}