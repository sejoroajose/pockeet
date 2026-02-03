'use client';

import { getTextRecord, getTextRecords } from './resolver';

/**
 * Pockeet-specific ENS text record keys
 */
export const POCKEET_KEYS = {
  TREASURY_ID: 'com.pockeet.treasury',
  AUTO_WITHDRAW: 'com.pockeet.auto-withdraw',
  WITHDRAW_THRESHOLD: 'com.pockeet.threshold',
  YIELD_STRATEGY: 'com.pockeet.strategy',
  NOTIFICATION_CHANNEL: 'com.pockeet.notification',
  PREFERRED_CHAIN: 'com.pockeet.chain',
  RISK_TOLERANCE: 'com.pockeet.risk',
  EMAIL: 'com.pockeet.email',
  TELEGRAM: 'com.pockeet.telegram',
  DISCORD: 'com.pockeet.discord',
} as const;

export interface TreasurySettings {
  treasuryId?: string;
  autoWithdraw: boolean;
  withdrawThreshold: string;
  yieldStrategy: 'conservative' | 'moderate' | 'aggressive';
  notificationChannel?: string;
  preferredChain?: string;
  riskTolerance: 'low' | 'medium' | 'high';
  email?: string;
  telegram?: string;
  discord?: string;
}

/**
 * Get CrossVault treasury settings from ENS
 */
export async function getTreasurySettings(
  ensName: string
): Promise<TreasurySettings> {
  const keys = Object.values(POCKEET_KEYS);
  const records = await getTextRecords(ensName, keys);
  
  return {
    treasuryId: records[POCKEET_KEYS.TREASURY_ID] || undefined,
    autoWithdraw: records[POCKEET_KEYS.AUTO_WITHDRAW] === 'true',
    withdrawThreshold: records[POCKEET_KEYS.WITHDRAW_THRESHOLD] || '10000',
    yieldStrategy: parseYieldStrategy(records[POCKEET_KEYS.YIELD_STRATEGY]),
    notificationChannel: records[POCKEET_KEYS.NOTIFICATION_CHANNEL] || undefined,
    preferredChain: records[POCKEET_KEYS.PREFERRED_CHAIN] || undefined,
    riskTolerance: parseRiskTolerance(records[POCKEET_KEYS.RISK_TOLERANCE]),
    email: records[POCKEET_KEYS.EMAIL] || undefined,
    telegram: records[POCKEET_KEYS.TELEGRAM] || undefined,
    discord: records[POCKEET_KEYS.DISCORD] || undefined,
  };
}

/**
 * Get specific treasury setting
 */
export async function getTreasurySetting(
  ensName: string,
  key: keyof typeof POCKEET_KEYS
): Promise<string | null> {
  return getTextRecord(ensName, POCKEET_KEYS[key]);
}

/**
 * Check if ENS has CrossVault treasury configured
 */
export async function hasTreasury(ensName: string): Promise<boolean> {
  const treasuryId = await getTreasurySetting(ensName, 'TREASURY_ID');
  return treasuryId !== null;
}

/**
 * Get auto-withdrawal settings
 */
export async function getAutoWithdrawSettings(ensName: string): Promise<{
  enabled: boolean;
  threshold: string;
  chain?: string;
}> {
  const [enabled, threshold, chain] = await Promise.all([
    getTreasurySetting(ensName, 'AUTO_WITHDRAW'),
    getTreasurySetting(ensName, 'WITHDRAW_THRESHOLD'),
    getTreasurySetting(ensName, 'PREFERRED_CHAIN'),
  ]);
  
  return {
    enabled: enabled === 'true',
    threshold: threshold || '10000',
    chain: chain || undefined,
  };
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(ensName: string): Promise<{
  channel?: string;
  email?: string;
  telegram?: string;
  discord?: string;
}> {
  const [channel, email, telegram, discord] = await Promise.all([
    getTreasurySetting(ensName, 'NOTIFICATION_CHANNEL'),
    getTreasurySetting(ensName, 'EMAIL'),
    getTreasurySetting(ensName, 'TELEGRAM'),
    getTreasurySetting(ensName, 'DISCORD'),
  ]);
  
  return {
    channel: channel || undefined,
    email: email || undefined,
    telegram: telegram || undefined,
    discord: discord || undefined,
  };
}

/**
 * Get yield strategy preference
 */
export async function getYieldStrategy(
  ensName: string
): Promise<'conservative' | 'moderate' | 'aggressive'> {
  const strategy = await getTreasurySetting(ensName, 'YIELD_STRATEGY');
  return parseYieldStrategy(strategy);
}

/**
 * Parse yield strategy from text record
 */
function parseYieldStrategy(
  value: string | null
): 'conservative' | 'moderate' | 'aggressive' {
  switch (value?.toLowerCase()) {
    case 'conservative':
      return 'conservative';
    case 'aggressive':
      return 'aggressive';
    case 'moderate':
    default:
      return 'moderate';
  }
}

/**
 * Parse risk tolerance from text record
 */
function parseRiskTolerance(value: string | null): 'low' | 'medium' | 'high' {
  switch (value?.toLowerCase()) {
    case 'low':
      return 'low';
    case 'high':
      return 'high';
    case 'medium':
    default:
      return 'medium';
  }
}

/**
 * Format settings for display
 */
export function formatTreasurySettings(settings: TreasurySettings): string[] {
  const formatted: string[] = [];
  
  if (settings.treasuryId) {
    formatted.push(`Treasury: ${settings.treasuryId.slice(0, 8)}...`);
  }
  
  if (settings.autoWithdraw) {
    formatted.push(`Auto-withdraw at $${settings.withdrawThreshold}`);
  }
  
  formatted.push(`Strategy: ${settings.yieldStrategy}`);
  formatted.push(`Risk: ${settings.riskTolerance}`);
  
  if (settings.preferredChain) {
    formatted.push(`Preferred chain: ${settings.preferredChain}`);
  }
  
  return formatted;
}

export default {
  POCKEET_KEYS,
  getTreasurySettings,
  getTreasurySetting,
  hasTreasury,
  getAutoWithdrawSettings,
  getNotificationPreferences,
  getYieldStrategy,
  formatTreasurySettings,
};