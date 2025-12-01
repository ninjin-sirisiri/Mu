import { ArrowLeft, ArrowRight, RotateCw, X, Minus, Square } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

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

  function handleMinimize() {
    appWindow.minimize();
  }

  function handleMaximize() {
    appWindow.toggleMaximize();
  }

  function handleClose() {
    appWindow.close();
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 backdrop-blur-md border-b border-gray-700 text-white shadow-lg">
      <div className="flex items-center space-x-2">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleForward}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <ArrowRight size={18} />
        </button>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <RotateCw size={18} />
        </button>
      </div>

      <div className="flex-1 mx-4">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={handleNavigate}
          placeholder="Search or enter address"
          className="w-full bg-gray-800 border border-gray-600 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-200 placeholder-gray-400"
        />
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleMinimize}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <Minus size={18} />
        </button>
        <button
          onClick={handleMaximize}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <Square size={18} />
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-red-600 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
