import { useState, useCallback } from 'react';
import type { SidebarSettings } from '../../../types/settings';

export interface SidebarState {
  isVisible: boolean;
  isHovered: boolean;
}

export interface SidebarStateControls {
  show: () => void;
  hide: () => void;
  toggle: () => void;
  setHovered: (hovered: boolean) => void;
}

/**
 * サイドバーの表示状態を管理するhook
 */
export const useSidebarState = (
  settings: SidebarSettings
): [SidebarState, SidebarStateControls] => {
  const [isVisible, setIsVisible] = useState(settings.mode === 'fixed');
  const [isHovered, setIsHovered] = useState(false);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => {
    if (settings.mode === 'auto-hide') {
      setIsVisible(false);
    }
  }, [settings.mode]);

  const toggle = useCallback(() => setIsVisible((prev) => !prev), []);

  const setHovered = useCallback(
    (hovered: boolean) => {
      setIsHovered(hovered);
      if (settings.mode === 'auto-hide') {
        setIsVisible(hovered);
      }
    },
    [settings.mode]
  );

  // auto-hideモードでは、ホバー状態で表示を決定
  const computedVisible = settings.mode === 'fixed' ? isVisible : isVisible || isHovered;

  return [
    { isVisible: computedVisible, isHovered },
    { show, hide, toggle, setHovered },
  ];
};
