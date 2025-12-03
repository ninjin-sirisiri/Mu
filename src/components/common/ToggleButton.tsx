import { type ReactNode } from 'react';

export type ToggleButtonProps = {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  variant?: 'default' | 'large';
};

/**
 * Reusable toggle button component for settings
 */
export function ToggleButton({
  active,
  onClick,
  icon,
  label,
  variant = 'default'
}: ToggleButtonProps) {
  const sizeClasses = variant === 'large' ? 'px-4 py-3 rounded-xl' : 'px-3 py-2 rounded-md';

  const activeClasses =
    variant === 'large'
      ? 'bg-blue-600 text-white ring-1 ring-blue-500'
      : 'bg-gray-600 text-gray-100 ring-1 ring-gray-500';

  const inactiveClasses =
    variant === 'large'
      ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300';

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2
        text-sm font-medium transition-all duration-150
        ${sizeClasses}
        ${active ? activeClasses : inactiveClasses}
      `}
      aria-pressed={active}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
