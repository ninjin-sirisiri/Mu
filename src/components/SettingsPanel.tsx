import { Settings, X, PanelLeft, PanelRight, Pin, EyeOff } from 'lucide-react';
import { useEffect, useRef, useMemo } from 'react';
import { type SidebarPosition, type SidebarMode } from '../store/settingsStore';

export type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  position: SidebarPosition;
  mode: SidebarMode;
  onPositionChange: (position: SidebarPosition) => void;
  onModeChange: (mode: SidebarMode) => void;
};

/**
 * Settings Panel component for sidebar customization
 * Requirements: 4.2
 */
export function SettingsPanel({
  isOpen,
  onClose,
  position,
  mode,
  onPositionChange,
  onModeChange
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close panel
  // Requirements: 4.4
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Add listener with a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      data-testid="settings-panel"
      className="absolute bottom-12 left-2 right-2 bg-gray-800 rounded-lg border border-gray-700/50 shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-200">Settings</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close settings">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="p-3 space-y-4">
        {/* Position Setting */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Sidebar Position
          </legend>
          <PositionToggleGroup
            position={position}
            onPositionChange={onPositionChange}
          />
        </fieldset>

        {/* Mode Setting */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Display Mode
          </legend>
          <ModeToggleGroup
            mode={mode}
            onModeChange={onModeChange}
          />
        </fieldset>
      </div>
    </div>
  );
}

type PositionToggleGroupProps = {
  position: SidebarPosition;
  onPositionChange: (position: SidebarPosition) => void;
};

function PositionToggleGroup({ position, onPositionChange }: PositionToggleGroupProps) {
  const leftIcon = useMemo(() => <PanelLeft className="w-4 h-4" />, []);
  const rightIcon = useMemo(() => <PanelRight className="w-4 h-4" />, []);

  return (
    <div className="flex gap-2">
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
  );
}

type ModeToggleGroupProps = {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
};

function ModeToggleGroup({ mode, onModeChange }: ModeToggleGroupProps) {
  const fixedIcon = useMemo(() => <Pin className="w-4 h-4" />, []);
  const autoHideIcon = useMemo(() => <EyeOff className="w-4 h-4" />, []);

  return (
    <div className="flex gap-2">
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
        flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md
        text-sm font-medium transition-all duration-150
        ${
          active
            ? 'bg-gray-600 text-gray-100 ring-1 ring-gray-500'
            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
        }
      `}
      aria-pressed={active}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
