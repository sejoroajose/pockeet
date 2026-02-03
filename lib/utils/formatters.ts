import { formatUnits, parseUnits } from 'viem';
import type { Address } from 'viem';

/**
 * Format USDC amount (6 decimals)
 */
export function formatUSDC(amount: bigint | string, decimals: number = 6): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  return formatUnits(value, decimals);
}

/**
 * Format USDC with dollar sign
 */
export function formatUSDCWithSign(amount: bigint | string): string {
  const formatted = formatUSDC(amount);
  return `$${parseFloat(formatted).toFixed(2)}`;
}

/**
 * Parse USDC amount to wei
 */
export function parseUSDC(amount: string, decimals: number = 6): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Format ETH amount (18 decimals)
 */
export function formatETH(amount: bigint | string): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  return formatUnits(value, 18);
}

/**
 * Format SUI amount (9 decimals)
 */
export function formatSUI(amount: bigint | string): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  return (Number(value) / 1_000_000_000).toFixed(4);
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatCompact(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format APY
 */
export function formatAPY(apy: string | number): string {
  const value = typeof apy === 'string' ? parseFloat(apy) : apy;
  return `${value.toFixed(2)}%`;
}

/**
 * Shorten address: 0x1234...5678
 */
export function shortenAddress(address: Address | string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format transaction hash
 */
export function shortenTxHash(hash: string, chars: number = 6): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format timestamp to readable datetime
 */
export function formatDateTime(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Format duration in seconds to readable format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''}`;
  return `${seconds} sec${seconds !== 1 ? 's' : ''}`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000) {
    return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  }
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(2)} MB`;
  }
  if (bytes >= 1_000) {
    return `${(bytes / 1_000).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

/**
 * Validate and format amount input
 */
export function formatAmountInput(input: string, decimals: number = 6): string {
  // Remove non-numeric characters except decimal point
  let cleaned = input.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places
  if (parts.length === 2 && parts[1].length > decimals) {
    cleaned = parts[0] + '.' + parts[1].slice(0, decimals);
  }
  
  return cleaned;
}

/**
 * Check if amount is valid
 */
export function isValidAmount(amount: string, min?: string, max?: string): boolean {
  const value = parseFloat(amount);
  
  if (isNaN(value) || value <= 0) {
    return false;
  }
  
  if (min && value < parseFloat(min)) {
    return false;
  }
  
  if (max && value > parseFloat(max)) {
    return false;
  }
  
  return true;
}

/**
 * Format chain name
 */
export function formatChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    42161: 'Arbitrum',
    10: 'Optimism',
    137: 'Polygon',
    8453: 'Base',
    5042002: 'Arc',
  };
  
  return chains[chainId] || `Chain ${chainId}`;
}

export default {
  formatUSDC,
  formatUSDCWithSign,
  parseUSDC,
  formatETH,
  formatSUI,
  formatCompact,
  formatPercent,
  formatAPY,
  shortenAddress,
  shortenTxHash,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  formatFileSize,
  formatAmountInput,
  isValidAmount,
  formatChainName,
};