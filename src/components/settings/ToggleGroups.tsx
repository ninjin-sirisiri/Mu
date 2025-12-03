import { PanelLeft, PanelRight, Pin, EyeOff } from 'lucide-react';
import { useMemo } from 'react';
import { type SidebarPosition, type SidebarMode } from '../../store/settingsStore';
import { ToggleButton } from '../common';

export type PositionToggleGroupProps = {
  position: SidebarPosition;
  onPositionChange: (position: SidebarPosition) => void;
  variant?: 'default' | 'large';
};

export function PositionToggleGroup({
  position,
  onPositionChange,
  variant = 'default'
}: PositionToggleGroupProps) {
  const leftIcon = useMemo(() => <PanelLeft className="w-4 h-4" />, []);
  const rightIcon = useMemo(() => <PanelRight className="w-4 h-4" />, []);

  return (
    <div className="flex gap-2">
      <ToggleButton
        active={position === 'left'}
        onClick={() => onPositionChange('left')}
        icon={leftIcon}
        label="Left"
        variant={variant}
      />
      <ToggleButton
        active={position === 'right'}
        onClick={() => onPositionChange('right')}
        icon={rightIcon}
        label="Right"
        variant={variant}
      />
    </div>
  );
}

export type ModeToggleGroupProps = {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  variant?: 'default' | 'large';
};

export function ModeToggleGroup({ mode, onModeChange, variant = 'default' }: ModeToggleGroupProps) {
  const fixedIcon = useMemo(() => <Pin className="w-4 h-4" />, []);
  const autoHideIcon = useMemo(() => <EyeOff className="w-4 h-4" />, []);

  return (
    <div className="flex gap-2">
      <ToggleButton
        active={mode === 'fixed'}
        onClick={() => onModeChange('fixed')}
        icon={fixedIcon}
        label="Fixed"
        variant={variant}
      />
      <ToggleButton
        active={mode === 'auto-hide'}
        onClick={() => onModeChange('auto-hide')}
        icon={autoHideIcon}
        label="Auto-hide"
        variant={variant}
      />
    </div>
  );
}
