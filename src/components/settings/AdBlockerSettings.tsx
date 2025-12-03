import { Shield, ShieldOff } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { type AdBlockerSettings as AdBlockerSettingsType } from '../../types/adblocker';
import { ToggleButton } from '../common';

/**
 * AdBlockerSettings - Ad blocker toggle and statistics display
 * Requirements: 2.1, 2.2, 2.6, 2.7, 5.2
 */
export function AdBlockerSettings() {
  const [enabled, setEnabled] = useState(true);
  const [blockCount, setBlockCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load ad blocker settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await invoke<AdBlockerSettingsType>('get_adblocker_settings');
        setEnabled(settings.enabled);
        setBlockCount(settings.blockCount);
      } catch (error) {
        toast.error(`Failed to load ad blocker settings: ${String(error)}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleToggle = useCallback(async (newEnabled: boolean) => {
    setEnabled(newEnabled);
    try {
      await invoke('set_adblocker_enabled', { enabled: newEnabled });
    } catch (error) {
      toast.error(`Failed to update ad blocker: ${String(error)}`);
      // Revert on failure
      setEnabled(!newEnabled);
    }
  }, []);

  const enabledIcon = useMemo(() => <Shield className="w-4 h-4" />, []);
  const disabledIcon = useMemo(() => <ShieldOff className="w-4 h-4" />, []);

  if (isLoading) {
    return <div className="text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2">
        <ToggleButton
          active={enabled}
          onClick={() => handleToggle(true)}
          icon={enabledIcon}
          label="ON"
          variant="large"
        />
        <ToggleButton
          active={!enabled}
          onClick={() => handleToggle(false)}
          icon={disabledIcon}
          label="OFF"
          variant="large"
        />
      </div>

      {/* Block count statistics */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Shield className="w-4 h-4" />
        <span>
          {blockCount.toLocaleString()} {blockCount === 1 ? 'ad' : 'ads'} blocked
        </span>
      </div>
    </div>
  );
}
