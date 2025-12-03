import { X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { type SidebarPosition, type SidebarMode } from '../../store/settingsStore';
import { PositionToggleGroup, ModeToggleGroup } from './ToggleGroups';

type SidebarSettings = {
  position: SidebarPosition;
  mode: SidebarMode;
};

/**
 * SettingsView - Full screen settings panel rendered in its own WebView
 */
export function SettingsView() {
  const [position, setPosition] = useState<SidebarPosition>('left');
  const [mode, setMode] = useState<SidebarMode>('auto-hide');
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await invoke<SidebarSettings>('get_sidebar_settings');
        setPosition(settings.position);
        setMode(settings.mode);
      } catch (error) {
        toast.error(`Failed to load settings: ${String(error)}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleClose = useCallback(async () => {
    try {
      await invoke('hide_settings');
    } catch (error) {
      toast.error(`Failed to close settings: ${String(error)}`);
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handlePositionChange = useCallback(
    async (newPosition: SidebarPosition) => {
      setPosition(newPosition);
      try {
        const settings: SidebarSettings = { position: newPosition, mode };
        await invoke('save_sidebar_settings', { settingsData: settings });
        await invoke('set_sidebar_position', { position: newPosition });
      } catch (error) {
        toast.error(`Failed to save settings: ${String(error)}`);
      }
    },
    [mode]
  );

  const handleModeChange = useCallback(
    async (newMode: SidebarMode) => {
      setMode(newMode);
      try {
        const settings: SidebarSettings = { position, mode: newMode };
        await invoke('save_sidebar_settings', { settingsData: settings });
      } catch (error) {
        toast.error(`Failed to save settings: ${String(error)}`);
      }
    },
    [position]
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50">
            <span className="text-sm font-medium text-gray-300">Settings</span>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
              aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6">
            {/* Position Setting */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Sidebar Position
              </legend>
              <PositionToggleGroup
                position={position}
                onPositionChange={handlePositionChange}
                variant="large"
              />
            </fieldset>

            {/* Mode Setting */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Display Mode
              </legend>
              <ModeToggleGroup
                mode={mode}
                onModeChange={handleModeChange}
                variant="large"
              />
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}
