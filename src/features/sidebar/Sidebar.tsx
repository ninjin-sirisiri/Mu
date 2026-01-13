import { useEffect } from 'react';
import type { Tab, TabControls } from '../tabs';
import type { SidebarSettings } from '../../types/settings';
import { SidebarContainer } from './components/SidebarContainer';
import { SidebarContent } from './components/SidebarContent';
import { useSidebarState } from './hooks/use-sidebar-state';

interface SidebarProps {
  settings: SidebarSettings;
  tabs: Tab[];
  tabControls: TabControls;
  onNewTab: () => void;
}

export function Sidebar({ settings, tabs, tabControls, onNewTab }: SidebarProps) {
  const [state, controls] = useSidebarState(settings);

  // auto-hideモード時、マウスがウィンドウの端に到達したらサイドバーを開く
  useEffect(() => {
    if (settings.mode !== 'auto-hide') return;

    const handleMouseMove = (e: MouseEvent) => {
      // ウィンドウの端からの閾値（ピクセル）
      const threshold = 1;

      if (settings.position === 'right') {
        // 右側配置の場合、カーソルがウィンドウ右端に到達したら開く
        const isAtRightEdge = e.clientX >= window.innerWidth - threshold;
        if (isAtRightEdge && !state.isVisible) {
          controls.setHovered(true);
        }
      } else {
        // 左側配置の場合、カーソルがウィンドウ左端に到達したら開く
        const isAtLeftEdge = e.clientX <= threshold;
        if (isAtLeftEdge && !state.isVisible) {
          controls.setHovered(true);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.mode, settings.position, state.isVisible, controls]);

  return (
    <>
      <SidebarContainer
        position={settings.position}
        width={settings.width}
        isVisible={state.isVisible}
        onMouseEnter={() => controls.setHovered(true)}
        onMouseLeave={() => controls.setHovered(false)}
      >
        <SidebarContent tabs={tabs} tabControls={tabControls} onNewTab={onNewTab} />
      </SidebarContainer>
    </>
  );
}
