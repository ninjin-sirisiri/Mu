import { ArrowLeft, ArrowRight, RotateCw, X, Minus, Square } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function NavigationControls() {
  const [url, setUrl] = useState('');
  const appWindow = getCurrentWindow();

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      unlisten = await listen<string>('content_navigation', event => {
        setUrl(event.payload);
      });
    })();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  async function handleBack() {
    await invoke('go_back');
  }

  async function handleForward() {
    await invoke('go_forward');
  }

  async function handleRefresh() {
    await invoke('reload');
  }

  async function handleNavigate(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const input = e.currentTarget;
      await invoke('navigate', { url });
      input.blur();
    }
  }

  async function handleMinimize() {
    await appWindow.minimize();
  }

  async function handleMaximize() {
    await appWindow.toggleMaximize();
  }

  async function handleClose() {
    await appWindow.close();
  }

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between px-4 py-2 bg-gray-400 backdrop-blur-md border-b border-gray-700 text-white shadow-lg">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          onClick={handleBack}>
          <ArrowLeft size={18} />
        </Button>
        <Button
          variant="ghost"
          onClick={handleForward}>
          <ArrowRight size={18} />
        </Button>
        <Button
          variant="ghost"
          onClick={handleRefresh}>
          <RotateCw size={18} />
        </Button>
      </div>

      <div className="flex-1 mx-4">
        <Input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={handleNavigate}
          placeholder="Search or enter address"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          onClick={handleMinimize}>
          <Minus size={18} />
        </Button>
        <Button
          variant="ghost"
          onClick={handleMaximize}>
          <Square size={18} />
        </Button>
        <Button
          className="hover:bg-red-600"
          variant="ghost"
          onClick={handleClose}>
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}
