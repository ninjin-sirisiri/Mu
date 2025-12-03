import { X, PanelLeft, PanelRight, Pin, EyeOff } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

type SidebarPosition = 'left' | 'right';
type SidebarMode = 'fixed' | 'auto-hide';

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
            <PositionSetting
              position={position}
              onPositionChange={handlePositionChange}
            />

            {/* Mode Setting */}
            <ModeSetting
              mode={mode}
              onModeChange={handleModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type ToggleButtonProps = {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
};

function ToggleButton({ active, onClick, icon, label }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
        text-sm font-medium transition-all duration-150
        ${
          active
            ? 'bg-blue-600 text-white ring-1 ring-blue-500'
            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
        }
      `}
      aria-pressed={active}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

type PositionSettingProps = {
  position: SidebarPosition;
  onPositionChange: (position: SidebarPosition) => void;
};

function PositionSetting({ position, onPositionChange }: PositionSettingProps) {
  const leftIcon = useMemo(() => <PanelLeft className="w-4 h-4" />, []);
  const rightIcon = useMemo(() => <PanelRight className="w-4 h-4" />, []);

  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Sidebar Position
      </legend>
      <div className="flex gap-3">
        <ToggleButton
          active={position === 'left'}
          onClick={() => onPositionChange('left')}
          icon={leftIcon}
          label="Left"
        />
        <ToggleButton
          active={position === 'right'}
          onClick={() => onPositionChange('right')}
          icon={rightIcon}
          label="Right"
        />
      </div>
    </fieldset>
  );
}

type ModeSettingProps = {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
};

function ModeSetting({ mode, onModeChange }: ModeSettingProps) {
  const fixedIcon = useMemo(() => <Pin className="w-4 h-4" />, []);
  const autoHideIcon = useMemo(() => <EyeOff className="w-4 h-4" />, []);

  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Display Mode
      </legend>
      <div className="flex gap-3">
        <ToggleButton
          active={mode === 'fixed'}
          onClick={() => onModeChange('fixed')}
          icon={fixedIcon}
          label="Fixed"
        />
        <ToggleButton
          active={mode === 'auto-hide'}
          onClick={() => onModeChange('auto-hide')}
          icon={autoHideIcon}
          label="Auto-hide"
        />
      </div>
    </fieldset>
  );
}
