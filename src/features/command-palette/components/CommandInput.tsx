import { useEffect, useRef } from 'react';

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  onMoveSelection: (delta: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function CommandInput({
  value,
  onChange,
  onExecute,
  onMoveSelection,
  onClose,
}: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // コマンドパレットが開かれるたびにinputにフォーカス
  useEffect(() => {
    // 初回マウント時にフォーカス
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    // WebViewが表示されたときに再度フォーカス（visibilitychange イベント）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

    // WebViewがフォーカスを受け取ったときにinputにフォーカス
    const handleWindowFocus = () => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onExecute();
      // フォーカスを解放
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onMoveSelection(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onMoveSelection(-1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // フォーカスを解放
      inputRef.current?.blur();
      onClose();
    }
  };

  return (
    <div className="border-b border-gray-200 p-4 dark:border-gray-800">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="コマンドを入力するか、URLを入力..."
        className="w-full border-none bg-transparent text-lg text-gray-900 outline-none placeholder:text-gray-400 focus-visible:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
      />
    </div>
  );
}
