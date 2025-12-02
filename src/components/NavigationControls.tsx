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
      className="flex items-center justify-between px-4 py-3.5 text-white">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <ArrowLeft size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForward}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <ArrowRight size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
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
          className="bg-gray-800/50 border-gray-700/50 text-gray-200 placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMinimize}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <Minus size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMaximize}
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-700/50">
          <Square size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-100 hover:bg-red-600/80">
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}
