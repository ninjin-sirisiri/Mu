import type { ReactNode } from 'react';

interface SidebarContainerProps {
  position: 'left' | 'right';
  width: number;
  isVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: ReactNode;
}

export function SidebarContainer({
  position,
  width,
  isVisible,
  onMouseEnter,
  onMouseLeave,
  children,
}: SidebarContainerProps) {
  return (
    <aside
      className={`
        fixed top-0 z-20 h-screen border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900
        ${position === 'left' ? 'left-0 border-r' : 'right-0 border-l'}
      `}
      style={{
        width: `${width}px`,
        opacity: isVisible ? 1 : 0.3,
        boxShadow: isVisible ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none',
        transition: 'opacity 200ms ease-out, box-shadow 200ms ease-out',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </aside>
  );
}
