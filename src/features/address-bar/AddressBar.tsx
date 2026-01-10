import type React from 'react';
import { useEffect, useState } from 'react';

interface AddressBarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  disabled?: boolean;
}

/** Temporary address bar component (will be replaced by command palette in Phase 2) */
export const AddressBar: React.FC<AddressBarProps> = ({
  currentUrl,
  onNavigate,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(currentUrl);

  // Sync input with external URL changes
  useEffect(() => {
    setInputValue(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = inputValue.trim();
    if (trimmedUrl) {
      onNavigate(trimmedUrl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setInputValue(currentUrl);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Enter URL..."
        className="w-full rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-blue-500 disabled:bg-neutral-100 disabled:text-neutral-400"
      />
    </form>
  );
};
