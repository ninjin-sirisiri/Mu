# Phase 2: コア機能

[← ロードマップ概要に戻る](./overview.md)

## 目標

Muの差別化要素となるキーボード中心の操作体系を確立し、複数タブの管理機能を実装します。このフェーズでMuの独自性が明確になり、従来のブラウザとの差別化が実現されます。

## 成果物

- **コマンドパレット**（Ctrl+K / Cmd+K）
- **URL入力とコマンド実行の統合インターフェース**
- **垂直タブ管理**（作成/削除/切り替え）
- **サイドバーシステム**（左右配置、固定/自動隠蔽モード）
- **キーボードショートカット体系**
- **v0.2.0リリース**: コマンドパレットで操作可能、複数タブ管理、サイドバー実装

## 実装タスク

### 1. コマンドパレット

#### 1.1 コマンドパレット構造の作成

- [x] `src/features/command-palette/`ディレクトリを作成
- [x] `CommandPalette.tsx`: メインコンポーネント
- [x] `components/CommandInput.tsx`: 入力フィールド
- [x] `components/CommandList.tsx`: コマンド検索結果リスト
- [x] `hooks/use-command-search.ts`: コマンド検索ロジック
- [x] `hooks/use-command-palette.ts`: コマンドパレットの状態管理
- [x] `types.ts`: 型定義
- [x] `index.ts`: 公開APIのエクスポート
- [x] `command-palette.html`: コマンドパレット専用のHTMLエントリーポイント
- [x] `command-palette-main.tsx`: コマンドパレット専用のReactエントリーポイント

#### 1.2 コマンド定義システム

- [x] `types.ts`: Command型定義
- [x] `commands.ts`: デフォルトコマンドのファクトリー関数
- [x] コマンド定義（ナビゲーション、タブ操作）

**実装済み型定義**:

```typescript
// src/features/command-palette/types.ts (実装済み)
export interface Command {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  action: () => void | Promise<void>;
  category?: 'navigation' | 'tab' | 'window' | 'other';
  shortcut?: string;
}
```

**実装済みコマンド登録**:

```typescript
// src/features/command-palette/commands.ts

import type { Command } from './types';

export const defaultCommands: Command[] = [
  {
    id: 'navigate-back',
    label: '戻る',
    description: '前のページに戻る',
    keywords: ['back', '戻る', 'もどる'],
    category: 'navigation',
    shortcut: 'Alt+←',
    action: async () => {
      // navigation.goBack()を呼び出し
    },
  },
  {
    id: 'navigate-forward',
    label: '進む',
    description: '次のページに進む',
    keywords: ['forward', '進む', 'すすむ'],
    category: 'navigation',
    shortcut: 'Alt+→',
    action: async () => {
      // navigation.goForward()を呼び出し
    },
  },
  {
    id: 'reload',
    label: '再読み込み',
    description: 'ページを再読み込み',
    keywords: ['reload', 'refresh', '再読み込み', 'リロード'],
    category: 'navigation',
    shortcut: 'Ctrl+R',
    action: async () => {
      // navigation.reload()を呼び出し
    },
  },
  {
    id: 'new-tab',
    label: '新しいタブ',
    description: '新しいタブを開く',
    keywords: ['new', 'tab', '新規', 'タブ'],
    category: 'tab',
    shortcut: 'Ctrl+T',
    action: async () => {
      // タブ作成処理を呼び出し
    },
  },
  {
    id: 'close-tab',
    label: 'タブを閉じる',
    description: '現在のタブを閉じる',
    keywords: ['close', 'tab', '閉じる', 'タブ'],
    category: 'tab',
    shortcut: 'Ctrl+W',
    action: async () => {
      // タブ削除処理を呼び出し
    },
  },
];
```

#### 1.3 URL入力 vs コマンド実行の判定

- [x] `utils/input-parser.ts`: 入力パーサー実装
- [x] URL、検索、コマンドの判定ロジック

**実装済み判定ロジック**:

```typescript
// src/features/command-palette/utils/input-parser.ts

/**
 * 入力がURLかコマンドかを判定
 */
export function parseInput(input: string): {
  type: 'url' | 'search' | 'command';
  value: string;
} {
  const trimmed = input.trim();

  // URLパターン
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    /^[\w-]+\.\w+/.test(trimmed)
  ) {
    return { type: 'url', value: trimmed };
  }

  // コマンドパターン（キーワードマッチ）
  // 実装: コマンドリストから検索

  // デフォルトは検索
  return { type: 'search', value: trimmed };
}
```

#### 1.4 ファジー検索の実装

- [x] `utils/fuzzy-search.ts`: ファジー検索実装
- [x] スコアリング機能（完全一致、前方一致、部分一致、キーワード一致）

**実装済みファジー検索**:

```typescript
// src/features/command-palette/utils/fuzzy-search.ts

/**
 * 簡易ファジー検索
 * 100行以内で実装（ミニマリズムの原則）
 */
export function fuzzySearch(
  query: string,
  items: Array<{ label: string; keywords: string[] }>,
): Array<{ item: typeof items[0]; score: number }> {
  const lowerQuery = query.toLowerCase();

  return items
    .map((item) => {
      const label = item.label.toLowerCase();
      const keywords = item.keywords.map((k) => k.toLowerCase());

      // スコア計算
      let score = 0;

      // ラベルに完全一致
      if (label === lowerQuery) score += 100;

      // ラベルに前方一致
      if (label.startsWith(lowerQuery)) score += 50;

      // ラベルに部分一致
      if (label.includes(lowerQuery)) score += 25;

      // キーワードに一致
      keywords.forEach((keyword) => {
        if (keyword.includes(lowerQuery)) score += 10;
      });

      return { item, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}
```

**注意**: 初期はこの簡易実装を使用します。コマンド数が100を超えてパフォーマンス問題が発生した場合のみ、外部ライブラリ（fuse.jsなど）の導入を検討します。

#### 1.5 CommandPaletteコンポーネント

- [x] `CommandPalette.tsx`: メインコンポーネント実装
- [x] `components/CommandInput.tsx`: 入力フィールド実装
- [x] `components/CommandList.tsx`: コマンドリスト実装
- [x] `command-palette-main.tsx`: 独立したReactアプリケーション
- [x] Tauri WebViewとして独立して動作

**実装済みコンポーネント**:

```typescript
// src/features/command-palette/CommandPalette.tsx

import React, { useState, useEffect } from 'react';
import { CommandInput } from './components/CommandInput';
import { CommandList } from './components/CommandList';
import { useCommandSearch } from './hooks/use-command-search';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const { results, executeCommand } = useCommandSearch(query);

  const handleExecute = async (commandId: string) => {
    await executeCommand(commandId);
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
        <CommandInput
          value={query}
          onChange={setQuery}
          onExecute={() => {
            if (results.length > 0) {
              handleExecute(results[0].id);
            }
          }}
          onClose={onClose}
        />
        <CommandList results={results} onSelect={handleExecute} />
      </div>
    </div>
  );
};
```

### 2. タブ管理システム

#### 2.1 バックエンド: タブモジュールの作成

- [x] `src-tauri/src/modules/tabs/`ディレクトリを作成
- [x] `mod.rs`: タブ管理の公開API
- [x] `commands.rs`: タブ操作のTauriコマンド
- [x] `models.rs`: Tab構造体とタブ状態管理
- [x] lib.rsへのコマンド登録とTabManager状態管理

**Tauriコマンド一覧**:

```rust
// src-tauri/src/modules/tabs/commands.rs

use super::models::Tab;
use tauri::State;
use std::sync::Mutex;

/// 新しいタブを作成
#[tauri::command]
pub fn create_tab(url: String, state: State<Mutex<TabManager>>) -> Result<String, String> {
    let mut manager = state.lock().unwrap();
    let tab_id = manager.create_tab(url);
    Ok(tab_id)
}

/// タブを閉じる
#[tauri::command]
pub fn close_tab(id: String, state: State<Mutex<TabManager>>) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    manager.close_tab(&id)?;
    Ok(())
}

/// タブを切り替える
#[tauri::command]
pub fn switch_tab(id: String, state: State<Mutex<TabManager>>) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    manager.switch_tab(&id)?;
    Ok(())
}

/// 全てのタブを取得
#[tauri::command]
pub fn get_all_tabs(state: State<Mutex<TabManager>>) -> Result<Vec<Tab>, String> {
    let manager = state.lock().unwrap();
    Ok(manager.get_all_tabs())
}

/// アクティブなタブIDを取得
#[tauri::command]
pub fn get_active_tab_id(state: State<Mutex<TabManager>>) -> Result<String, String> {
    let manager = state.lock().unwrap();
    manager.get_active_tab_id()
        .ok_or_else(|| "アクティブなタブがありません".to_string())
}
```

**データモデル**:

```rust
// src-tauri/src/modules/tabs/models.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tab {
    pub id: String,
    pub title: String,
    pub url: String,
    pub is_active: bool,
    pub favicon: Option<String>,
}

pub struct TabManager {
    tabs: HashMap<String, Tab>,
    active_tab_id: Option<String>,
    next_id: usize,
}

impl TabManager {
    pub fn new() -> Self {
        Self {
            tabs: HashMap::new(),
            active_tab_id: None,
            next_id: 1,
        }
    }

    pub fn create_tab(&mut self, url: String) -> String {
        let id = format!("tab-{}", self.next_id);
        self.next_id += 1;

        let tab = Tab {
            id: id.clone(),
            title: "新しいタブ".to_string(),
            url,
            is_active: false,
            favicon: None,
        };

        self.tabs.insert(id.clone(), tab);
        self.switch_tab(&id).ok();
        id
    }

    pub fn close_tab(&mut self, id: &str) -> Result<(), String> {
        if self.tabs.remove(id).is_none() {
            return Err("タブが見つかりません".to_string());
        }

        // アクティブなタブが閉じられた場合、別のタブをアクティブにする
        if self.active_tab_id.as_deref() == Some(id) {
            self.active_tab_id = self.tabs.keys().next().cloned();
        }

        Ok(())
    }

    pub fn switch_tab(&mut self, id: &str) -> Result<(), String> {
        if !self.tabs.contains_key(id) {
            return Err("タブが見つかりません".to_string());
        }

        // 現在のアクティブタブを非アクティブにする
        if let Some(current_id) = &self.active_tab_id {
            if let Some(tab) = self.tabs.get_mut(current_id) {
                tab.is_active = false;
            }
        }

        // 新しいタブをアクティブにする
        if let Some(tab) = self.tabs.get_mut(id) {
            tab.is_active = true;
            self.active_tab_id = Some(id.to_string());
            Ok(())
        } else {
            Err("タブが見つかりません".to_string())
        }
    }

    pub fn get_all_tabs(&self) -> Vec<Tab> {
        self.tabs.values().cloned().collect()
    }

    pub fn get_active_tab_id(&self) -> Option<String> {
        self.active_tab_id.clone()
    }
}
```

#### 2.2 フロントエンド: タブ機能の実装

- [x] `src/features/tabs/`ディレクトリを作成
- [x] `TabContainer.tsx`: タブバーコンテナ
- [x] `components/TabItem.tsx`: 個別タブUI
- [x] `components/TabList.tsx`: タブリスト
- [x] `hooks/use-tab-state.ts`: タブ状態管理hook
- [x] `types.ts`: 型定義
- [x] `index.ts`: 公開APIのエクスポート

**型定義**:

```typescript
// src/features/tabs/types.ts

export interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  favicon?: string;
}

export interface TabControls {
  createTab: (url?: string) => Promise<string>;
  closeTab: (id: string) => Promise<void>;
  switchTab: (id: string) => Promise<void>;
  getAllTabs: () => Promise<Tab[]>;
}
```

**use-tab-state.ts**:

```typescript
// src/features/tabs/hooks/use-tab-state.ts

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Tab, TabControls } from '../types';

export const useTabState = (): [Tab[], TabControls] => {
  const [tabs, setTabs] = useState<Tab[]>([]);

  const refreshTabs = useCallback(async () => {
    const allTabs = await invoke<Tab[]>('get_all_tabs');
    setTabs(allTabs);
  }, []);

  const createTab = useCallback(async (url = 'about:blank') => {
    const tabId = await invoke<string>('create_tab', { url });
    await refreshTabs();
    return tabId;
  }, [refreshTabs]);

  const closeTab = useCallback(async (id: string) => {
    await invoke('close_tab', { id });
    await refreshTabs();
  }, [refreshTabs]);

  const switchTab = useCallback(async (id: string) => {
    await invoke('switch_tab', { id });
    await refreshTabs();
  }, [refreshTabs]);

  const getAllTabs = useCallback(async () => {
    return await invoke<Tab[]>('get_all_tabs');
  }, []);

  useEffect(() => {
    refreshTabs();
  }, [refreshTabs]);

  return [
    tabs,
    {
      createTab,
      closeTab,
      switchTab,
      getAllTabs,
    },
  ];
};
```

**TabItem.tsx**:

```typescript
// src/features/tabs/components/TabItem.tsx

import React from 'react';
import type { Tab } from '../types';

interface TabItemProps {
  tab: Tab;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export const TabItem: React.FC<TabItemProps> = ({ tab, onSelect, onClose }) => {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer
        ${tab.isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}
      `}
      onClick={() => onSelect(tab.id)}
    >
      {tab.favicon && (
        <img src={tab.favicon} alt="" className="w-4 h-4" />
      )}
      <span className="flex-1 truncate text-sm">{tab.title}</span>
      <button
        className="p-1 hover:bg-gray-200 rounded"
        onClick={(e) => {
          e.stopPropagation();
          onClose(tab.id);
        }}
      >
        ×
      </button>
    </div>
  );
};
```

### 3. キーボードショートカット

#### 3.1 グローバルキーボードフックの実装

- [x] `src/hooks/use-keyboard.ts`を作成
- [x] キーボードイベントのリスナーを実装
- [x] ショートカット定義とアクションのマッピング

**use-keyboard.ts**:

```typescript
// src/hooks/use-keyboard.ts

import { useEffect } from 'react';

export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
};

export const useKeyboard = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key === shortcut.key;
        const matchesCtrl = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;
        const matchesMeta = shortcut.meta ? event.metaKey : !event.metaKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
```

#### 3.2 グローバルショートカット定義

- [x] lib.rsでのグローバルショートカット実装（tauri-plugin-global-shortcut使用）
- [x] Ctrl+L: コマンドパレットトグル
- [x] Ctrl+T: 新しいタブ
- [x] Ctrl+W: タブを閉じる
- [x] Ctrl+B: サイドバートグル
- [x] Alt+←: 戻る
- [x] Alt+→: 進む
- [x] Ctrl+R: リロード
- [x] Ctrl+Tab: 次のタブに切り替え
- [x] Ctrl+Shift+Tab: 前のタブに切り替え
- [x] Esc: コマンドパレットを閉じる

**実装済みグローバルショートカット（lib.rs）**:

```typescript
// src/App.tsx（抜粋）

import { useKeyboard } from './hooks/use-keyboard';

function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  // ... その他の状態

  useKeyboard([
    {
      key: 'k',
      ctrl: true,
      action: () => setIsCommandPaletteOpen(true),
    },
    {
      key: 't',
      ctrl: true,
      action: () => {
        // 新しいタブを作成
      },
    },
    {
      key: 'w',
      ctrl: true,
      action: () => {
        // タブを閉じる
      },
    },
    {
      key: 'Tab',
      ctrl: true,
      action: () => {
        // 次のタブに切り替え
      },
    },
    {
      key: 'Tab',
      ctrl: true,
      shift: true,
      action: () => {
        // 前のタブに切り替え
      },
    },
  ]);

  // ...
}
```

**ショートカット一覧**（10個以内に制限）:

1. `Ctrl+K` / `Cmd+K`: コマンドパレットを開く
2. `Ctrl+T`: 新しいタブ
3. `Ctrl+W`: タブを閉じる
4. `Ctrl+Tab`: 次のタブに切り替え
5. `Ctrl+Shift+Tab`: 前のタブに切り替え
6. `Ctrl+L`: URL入力にフォーカス（コマンドパレットを開く）
7. `Alt+←`: 戻る
8. `Alt+→`: 進む
9. `Ctrl+R` / `F5`: リロード
10. `Esc`: モーダルを閉じる

### 4. サイドバーシステム

#### 4.1 サイドバーコンポーネントの作成

- [x] `src/features/sidebar/`ディレクトリを作成
- [x] `Sidebar.tsx`: サイドバーメインコンポーネント
- [x] `components/SidebarContainer.tsx`: コンテナ（位置制御）
- [x] `components/SidebarContent.tsx`: コンテンツ（タブリスト）
- [x] `hooks/use-sidebar-state.ts`: サイドバー状態管理
- [x] `index.ts`: 公開APIのエクスポート

**Sidebar.tsx**:

```typescript
// src/features/sidebar/Sidebar.tsx

import React, { useState } from 'react';
import { SidebarContainer } from './components/SidebarContainer';
import { SidebarContent } from './components/SidebarContent';
import { useSettings } from '../../hooks/use-settings';

export const Sidebar: React.FC = () => {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(true);

  if (!settings) return null;

  const { position, mode, width } = settings.sidebar;

  // 自動隠蔽モードの場合、マウスホバーで表示
  const handleMouseEnter = () => {
    if (mode === 'auto-hide') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (mode === 'auto-hide') {
      setIsVisible(false);
    }
  };

  return (
    <SidebarContainer
      position={position}
      width={width}
      isVisible={isVisible || mode === 'fixed'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarContent />
    </SidebarContainer>
  );
};
```

**SidebarContainer.tsx**:

```typescript
// src/features/sidebar/components/SidebarContainer.tsx

import React from 'react';

interface SidebarContainerProps {
  position: 'left' | 'right';
  width: number;
  isVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
}

export const SidebarContainer: React.FC<SidebarContainerProps> = ({
  position,
  width,
  isVisible,
  onMouseEnter,
  onMouseLeave,
  children,
}) => {
  const translateX = isVisible ? 0 : position === 'left' ? -width : width;

  return (
    <aside
      className={`
        fixed top-0 h-screen bg-white border-r shadow-lg
        transition-transform duration-200
        ${position === 'left' ? 'left-0' : 'right-0'}
      `}
      style={{
        width: `${width}px`,
        transform: `translateX(${translateX}px)`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </aside>
  );
};
```

**SidebarContent.tsx**:

```typescript
// src/features/sidebar/components/SidebarContent.tsx

import React from 'react';
import { TabList } from '../../tabs/components/TabList';

export const SidebarContent: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* タブリスト */}
      <div className="flex-1 overflow-y-auto">
        <TabList />
      </div>
    </div>
  );
};
```

#### 4.2 タブバーをサイドバーに移行

- [x] Phase 2で作成したタブバーをサイドバー内に移動
- [x] タブリストのスタイルを垂直レイアウトに調整
- [x] App.tsxでサイドバーコンポーネントを使用

## 技術的課題と解決策

### 課題1: コマンドパレットのパフォーマンス

**課題**: 大量のコマンドで検索が遅くならないか

**解決策**:
- 初期は自前実装の簡易ファジー検索を使用（100行以内）
- コマンド数が100を超えた場合のみ、パフォーマンスを測定
- 必要に応じて外部ライブラリ（fuse.js）の導入を検討

**実装方針**: ミニマリズムの原則に従い、まず自前実装で進める

### 課題2: タブとWebViewの関連付け

**課題**: 各タブが独立したWebViewを持つ必要がある

**解決策**:
- Rust側で`HashMap<TabId, WebviewWindow>`で管理
- アクティブなタブのみWebViewを表示、他は`hide()`で非表示
- メモリ使用量を監視し、非アクティブタブが多い場合は破棄して再生成も検討

**参考**: Tauri `WebviewWindow::hide()` / `show()` API

### 課題3: キーボードショートカットの衝突

**課題**: モーダルが開いている時にショートカットが誤動作する

**解決策**:
- ショートカットのコンテキストを管理
- モーダルが開いている時は特定のショートカットのみ有効化
- `event.stopPropagation()`で適切にイベント伝播を制御

## 依存関係

**前提条件**: Phase 1のWebView実装とナビゲーション機能が完了していること

**後続フェーズへの影響**:
- Phase 3のサイドバーは、このタブバーを拡張・移動する形で実装
- コマンドパレットは、Phase 3以降も拡張して使用

## 完了条件

- [x] Ctrl+L（Ctrl+K相当）でコマンドパレットが開く
- [x] コマンドパレットでURL入力とコマンド実行が可能
- [x] ファジー検索でコマンドを絞り込める
- [x] 複数のタブを作成し、切り替えられる
- [x] タブを閉じる操作が動作する
- [x] キーボードショートカット（10個）が全て機能する
  - [x] Ctrl+L: コマンドパレット
  - [x] Ctrl+T: 新しいタブ
  - [x] Ctrl+W: タブを閉じる
  - [x] Ctrl+B: サイドバートグル
  - [x] Alt+←: 戻る
  - [x] Alt+→: 進む
  - [x] Ctrl+R: リロード
  - [x] Ctrl+Tab: 次のタブ
  - [x] Ctrl+Shift+Tab: 前のタブ
  - [x] Esc: モーダルを閉じる
- [x] サイドバーが左右に配置できる
- [x] サイドバーが固定/自動隠蔽モードで動作する
- [x] タブリストがサイドバー内に表示される
- [x] 実際の動作確認（`bun run tauri dev`でテスト）
- [x] `docs/rules/minimalism-implementation.md`の原則に準拠している

## テスト項目

### コマンドパレット

- [x] Ctrl+Lでパレットが開く
- [x] URL入力時に適切に判定される（http://, https://, ドメイン名）
- [x] コマンド検索でファジーマッチが機能する
- [x] Enterで選択されたコマンドが実行される
- [x] パレット外クリックでパレットが閉じる
- [x] URL入力後、該当URLに遷移する
- [x] 検索クエリ入力後、Google検索に遷移する
- [x] コマンド実行後、正しい動作が行われる

### タブ管理

- [x] Ctrl+Tで新しいタブが作成される
- [x] サイドバーでタブをクリックして切り替えられる
- [x] ×ボタンでタブが閉じられる
- [x] Ctrl+Wで現在のタブが閉じられる
- [x] タブ切り替え時に対応するWebViewが表示される
- [x] タブのタイトルとURLが正しく表示される

### キーボードショートカット

- [x] Ctrl+L: コマンドパレットが開く
- [x] Ctrl+T: 新しいタブが作成される
- [x] Ctrl+W: 現在のタブが閉じられる
- [x] Ctrl+B: サイドバーがトグルする
- [x] Alt+←: 前のページに戻る
- [x] Alt+→: 次のページに進む
- [x] Ctrl+R: ページをリロードする
- [x] Ctrl+Tab: 次のタブに切り替える
- [x] Ctrl+Shift+Tab: 前のタブに切り替える
- [x] Esc: コマンドパレットを閉じる

### サイドバー

- [x] Ctrl+Bでサイドバーがトグルする
- [x] マウスホバーで自動的に表示される
- [x] マウスが離れると自動的に隠れる
- [x] タブリストがサイドバー内に正しく表示される
- [x] ナビゲーションボタン（戻る、進む、リロード、ホーム）が表示される
- [x] 新規タブボタンが機能する

## 参照ドキュメント

- [`docs/rules/minimalism-implementation.md`](../rules/minimalism-implementation.md) - コマンドパレット設計
- [`docs/rules/ui-design-guidelines.md`](../rules/ui-design-guidelines.md) - UI実装パターン
- [`docs/rules/coding-guidelines.md`](../rules/coding-guidelines.md) - コーディング規約
- [Tauri State Management](https://v2.tauri.app/develop/state-management/) - Rust側の状態管理

## 次のステップ

Phase 2が完了したら、[Phase 3: 高度な機能](./phase-3-advanced-features.md)に進みます。

Phase 3では、広告ブロック、設定システムを実装します。

---

[← Phase 1: 基盤構築](./phase-1-foundation.md) | [ロードマップ概要](./overview.md) | [Phase 3: 高度な機能 →](./phase-3-advanced-features.md)
