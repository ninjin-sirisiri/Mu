import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { NavigationControls } from './components/NavigationControls';
import { Toaster } from './components/ui/sonner';
import './index.css';

const COLLAPSED_HEIGHT = 20;
const EXPANDED_HEIGHT = 80;

export default function App() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function updateHeight(height: number) {
      try {
        await invoke('set_ui_height', { height });
      } catch (error) {
        toast.error(String(error));
      }
    }

    if (isVisible) {
      updateHeight(EXPANDED_HEIGHT);
    } else {
      // Wait for animation to complete (300ms) before shrinking the webview
      const timer = setTimeout(() => {
        updateHeight(COLLAPSED_HEIGHT);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div className="relative w-full h-screen pointer-events-none">
      <Toaster />
      {/* Trigger Zone */}
      <div
        className="absolute top-0 left-0 w-full h-4 z-50 pointer-events-auto"
        onMouseEnter={() => setIsVisible(true)}
      />

      {/* Header */}
      <div
        className={`absolute top-0 left-0 w-full pointer-events-auto transition-transform duration-300 z-50 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
        onMouseLeave={() => setIsVisible(false)}>
        <NavigationControls />
      </div>
    </div>
  );
}
