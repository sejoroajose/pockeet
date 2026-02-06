'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, CheckCircle2, AlertCircle, Loader2, ExternalLink, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useENS, useTreasurySettings } from '@/lib/ens/hooks';
import { useVaultInfo } from '@/lib/sui/hooks';
import { SUI_CONFIG } from '@/lib/utils/constants';
import type { Address } from 'viem';

interface ENSTreasuryControllerProps {
  address?: Address;
  onSettingsApplied?: (settings: any) => void;
}

export function ENSTreasuryController({
  address,
  onSettingsApplied,
}: ENSTreasuryControllerProps) {
  const { ensName, loading: ensLoading } = useENS(address);
  const { settings, hasTreasury, loading: settingsLoading } = useTreasurySettings(ensName || undefined);
  const { info } = useVaultInfo(SUI_CONFIG.VAULT_OBJECT_ID);
  
  const [appliedStrategy, setAppliedStrategy] = useState<string | null>(null);
  const [autoWithdrawEnabled, setAutoWithdrawEnabled] = useState(false);
  const [applying, setApplying] = useState(false);

  // Apply ENS settings to vault
  useEffect(() => {
    if (!settings || !hasTreasury) return;

    async function applySettings() {
      setApplying(true);

      // Simulate applying settings (in production, this would call smart contract)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set strategy from ENS
      if (settings.yieldStrategy) {
        setAppliedStrategy(settings.yieldStrategy);
        console.log(`✅ Applied ${settings.yieldStrategy} strategy from ${ensName}`);
      }

      // Enable auto-withdraw from ENS
      if (settings.autoWithdraw) {
        setAutoWithdrawEnabled(true);
        console.log(`✅ Auto-withdraw enabled at $${settings.withdrawThreshold}`);
      }

      setApplying(false);
      onSettingsApplied?.(settings);
    }

    applySettings();
  }, [settings, hasTreasury, ensName, onSettingsApplied]);

  // Check auto-withdraw threshold
  useEffect(() => {
    if (!autoWithdrawEnabled || !settings?.withdrawThreshold || !info?.userBalance) return;

    const balance = parseFloat(info.userBalance);
    const threshold = parseFloat(settings.withdrawThreshold);

    if (balance >= threshold) {
      console.log(`🎯 Auto-withdraw triggered: $${balance} >= $${threshold}`);
      // In production, trigger actual withdrawal
    }
  }, [autoWithdrawEnabled, settings, info]);

  if (!address) return null;

  if (ensLoading || settingsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Checking ENS treasury settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No ENS name
  if (!ensName) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>ENS Treasury Control</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-4">
              Get an ENS name to control your treasury settings on-chain!
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://app.ens.domains', '_blank')}
            >
              Get ENS Name
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has ENS but no treasury configured
  if (!hasTreasury) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-purple-600" />
            <span>ENS Treasury Control</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
              {ensName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{ensName}</p>
              <Badge variant="secondary">Not Configured</Badge>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              Configure Your Treasury
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Store these text records in your ENS name to enable automatic treasury management:
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">com.pockeet.strategy</span>
                <span className="text-purple-700">moderate</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">com.pockeet.auto-withdraw</span>
                <span className="text-purple-700">true</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">com.pockeet.threshold</span>
                <span className="text-purple-700">10000</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">com.pockeet.risk</span>
                <span className="text-purple-700">medium</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => window.open(`https://app.ens.domains/${ensName}`, '_blank')}
          >
            Configure in ENS
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Has ENS with treasury configured - ACTIVE CONTROL
  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-white shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            <span>ENS Treasury Control</span>
          </CardTitle>
          <Badge variant="success" className="animate-pulse">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ENS Identity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-emerald-200"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white font-coolvetica text-xl">
            {ensName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-coolvetica text-lg font-bold text-gray-900">{ensName}</p>
            <p className="text-sm text-emerald-700">Treasury settings applied ✓</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`https://app.ens.domains/${ensName}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Active Settings */}
        <AnimatePresence>
          {applying ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center space-x-2 p-4 bg-blue-50 rounded-lg"
            >
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700">Applying treasury settings...</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Yield Strategy */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Yield Strategy</p>
                    <p className="text-xs text-gray-600">From ENS text record</p>
                  </div>
                </div>
                <Badge variant="default" className="capitalize">
                  {settings.yieldStrategy}
                </Badge>
              </div>

              {/* Auto-Withdraw */}
              {settings.autoWithdraw && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Auto-Withdraw</p>
                      <p className="text-xs text-gray-600">Enabled at threshold</p>
                    </div>
                  </div>
                  <Badge variant="success">
                    ${settings.withdrawThreshold}
                  </Badge>
                </div>
              )}

              {/* Risk Tolerance */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Risk Tolerance</p>
                    <p className="text-xs text-gray-600">From ENS settings</p>
                  </div>
                </div>
                <Badge
                  variant={
                    settings.riskTolerance === 'low' ? 'success' :
                    settings.riskTolerance === 'medium' ? 'default' :
                    'warning'
                  }
                  className="capitalize"
                >
                  {settings.riskTolerance}
                </Badge>
              </div>

              {/* Notifications */}
              {settings.email && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Notifications</p>
                      <p className="text-xs text-gray-600 truncate max-w-[200px]">
                        {settings.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">Email</Badge>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Status */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white">
          <h4 className="font-semibold mb-2 flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Live Treasury Control</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-emerald-100 text-xs mb-1">Current Strategy</p>
              <p className="font-semibold capitalize">{appliedStrategy || settings.yieldStrategy}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs mb-1">Auto-Withdraw</p>
              <p className="font-semibold">
                {autoWithdrawEnabled ? '✓ Enabled' : '✗ Disabled'}
              </p>
            </div>
          </div>
          <p className="text-xs text-emerald-100 mt-3">
            💡 Your ENS name controls this vault. Update text records to change settings instantly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}