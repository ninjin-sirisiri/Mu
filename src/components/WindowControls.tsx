import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

interface WindowControlButtonProps {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  variant?: 'default' | 'close';
}

const WindowControlButton: React.FC<WindowControlButtonProps> = ({
  onClick,
  ariaLabel,
  children,
  variant = 'default',
}) => {
  const baseStyles =
    'flex h-8 w-10 items-center justify-center text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:text-gray-400';
  const variantStyles =
    variant === 'close'
      ? 'hover:bg-red-500 hover:text-white'
      : 'hover:bg-gray-200 dark:hover:bg-gray-800';

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export const WindowControls: React.FC = () => {
  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    appWindow.toggleMaximize();
  };

  const handleClose = () => {
    appWindow.close();
  };

  return (
    <div className="flex items-center">
      <WindowControlButton onClick={handleMinimize} ariaLabel="Minimize">
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </WindowControlButton>
      <WindowControlButton onClick={handleMaximize} ariaLabel="Maximize">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
          <rect x="0.5" y="0.5" width="9" height="9" strokeWidth="1" />
        </svg>
      </WindowControlButton>
      <WindowControlButton onClick={handleClose} ariaLabel="Close" variant="close">
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
          <line x1="0" y1="0" x2="10" y2="10" />
          <line x1="10" y1="0" x2="0" y2="10" />
        </svg>
      </WindowControlButton>
    </div>
  );
};
