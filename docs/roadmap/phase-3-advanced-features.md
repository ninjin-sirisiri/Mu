# Phase 3: 高度な機能

[← ロードマップ概要に戻る](./overview.md)

## 目標

カスタマイズ性と生産性向上機能を追加します。広告ブロック、設定システムを実装し、ユーザーがブラウザを自分の好みにカスタマイズできるようにします。

## 成果物

- **広告ブロック機能**（ドメインベースのブロックリスト）
- **設定システム**（永続化、設定UI）
- **テーマ切り替え**（ライト/ダーク）
- **v0.3.0リリース**: フル機能実装、カスタマイズ可能

## 実装タスク

### 1. 設定システム（最初に実装）

設定システムは他の機能（サイドバー、広告ブロック）の基盤となるため、最初に実装します。

#### 1.1 バックエンド: 設定ストレージの実装

- [ ] `src-tauri/src/modules/storage/`ディレクトリを作成
- [ ] `mod.rs`: 設定管理の公開API
- [ ] `commands.rs`: 設定操作のTauriコマンド
- [ ] `models.rs`: 設定データモデル

**データモデル**:

```rust
// src-tauri/src/modules/storage/models.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    // サイドバー設定
    pub sidebar: SidebarSettings,
    // テーマ設定
    pub theme: Theme,
    // 広告ブロック設定
    pub ad_blocker: AdBlockerSettings,
    // その他
    pub home_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarSettings {
    pub position: SidebarPosition,
    pub mode: SidebarMode,
    pub width: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SidebarPosition {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SidebarMode {
    Fixed,
    AutoHide,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    Light,
    Dark,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdBlockerSettings {
    pub enabled: bool,
    pub blocked_domains: Vec<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            sidebar: SidebarSettings {
                position: SidebarPosition::Left,
                mode: SidebarMode::Fixed,
                width: 200,
            },
            theme: Theme::System,
            ad_blocker: AdBlockerSettings {
                enabled: true,
                blocked_domains: vec![],
            },
            home_url: "about:blank".to_string(),
        }
    }
}
```

**Tauriコマンド**:

```rust
// src-tauri/src/modules/storage/commands.rs

use super::models::Settings;
use tauri::State;
use std::sync::Mutex;

/// 設定を読み込み
#[tauri::command]
pub fn get_settings(state: State<Mutex<Settings>>) -> Result<Settings, String> {
    let settings = state.lock().unwrap();
    Ok(settings.clone())
}

/// 設定を保存
#[tauri::command]
pub fn save_settings(settings: Settings, state: State<Mutex<Settings>>) -> Result<(), String> {
    let mut current = state.lock().unwrap();
    *current = settings.clone();

    // ファイルに永続化
    // 実装: JSONファイルに保存

    Ok(())
}

/// 設定の一部を更新
#[tauri::command]
pub fn update_setting(key: String, value: serde_json::Value, state: State<Mutex<Settings>>) -> Result<(), String> {
    // 実装: 特定の設定項目のみを更新
    Ok(())
}
```

#### 1.2 フロントエンド: 設定フックの実装

- [ ] `src/hooks/use-settings.ts`を作成
- [ ] `src/types/settings.d.ts`を作成

```typescript
// src/types/settings.d.ts

export interface Settings {
  sidebar: SidebarSettings;
  theme: Theme;
  adBlocker: AdBlockerSettings;
  homeUrl: string;
}

export interface SidebarSettings {
  position: 'left' | 'right';
  mode: 'fixed' | 'auto-hide';
  width: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface AdBlockerSettings {
  enabled: boolean;
  blockedDomains: string[];
}
```

```typescript
// src/hooks/use-settings.ts

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Settings } from '../types/settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

  const loadSettings = useCallback(async () => {
    const loaded = await invoke<Settings>('get_settings');
    setSettings(loaded);
  }, []);

  const saveSettings = useCallback(async (newSettings: Settings) => {
    await invoke('save_settings', { settings: newSettings });
    setSettings(newSettings);
  }, []);

  const updateSetting = useCallback(async (key: string, value: any) => {
    await invoke('update_setting', { key, value });
    await loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    saveSettings,
    updateSetting,
    loadSettings,
  };
};
```

### 2. 広告ブロック機能

#### 2.1 バックエンド: 広告ブロックモジュール

- [ ] `src-tauri/src/modules/ad_blocker/`ディレクトリを作成
- [ ] `mod.rs`: 広告ブロック機能の公開API
- [ ] `commands.rs`: ブロックリスト管理のTauriコマンド
- [ ] `filter.rs`: URLフィルタリングロジック

**Tauriコマンド**:

```rust
// src-tauri/src/modules/ad_blocker/commands.rs

/// ドメインをブロックリストに追加
#[tauri::command]
pub fn add_blocked_domain(domain: String, state: State<Mutex<Settings>>) -> Result<(), String> {
    let mut settings = state.lock().unwrap();
    if !settings.ad_blocker.blocked_domains.contains(&domain) {
        settings.ad_blocker.blocked_domains.push(domain);
        // 設定を保存
    }
    Ok(())
}

/// ドメインをブロックリストから削除
#[tauri::command]
pub fn remove_blocked_domain(domain: String, state: State<Mutex<Settings>>) -> Result<(), String> {
    let mut settings = state.lock().unwrap();
    settings.ad_blocker.blocked_domains.retain(|d| d != &domain);
    // 設定を保存
    Ok(())
}

/// URLがブロックされるべきかチェック
#[tauri::command]
pub fn should_block_url(url: String, state: State<Mutex<Settings>>) -> Result<bool, String> {
    let settings = state.lock().unwrap();

    if !settings.ad_blocker.enabled {
        return Ok(false);
    }

    for domain in &settings.ad_blocker.blocked_domains {
        if url.contains(domain) {
            return Ok(true);
        }
    }

    Ok(false)
}
```

#### 2.2 フロントエンド: ブロックリスト管理UI

- [ ] `src/features/ad-blocker/`ディレクトリを作成
- [ ] `BlockedDomainsList.tsx`: ブロックリスト表示
- [ ] `AddDomainForm.tsx`: ドメイン追加フォーム

```typescript
// src/features/ad-blocker/BlockedDomainsList.tsx

import React from 'react';
import { invoke } from '@tauri-apps/api/core';

interface BlockedDomainsListProps {
  domains: string[];
  onUpdate: () => void;
}

export const BlockedDomainsList: React.FC<BlockedDomainsListProps> = ({
  domains,
  onUpdate,
}) => {
  const handleRemove = async (domain: string) => {
    await invoke('remove_blocked_domain', { domain });
    onUpdate();
  };

  return (
    <ul className="space-y-2">
      {domains.map((domain) => (
        <li key={domain} className="flex items-center justify-between p-2 bg-gray-100 rounded">
          <span>{domain}</span>
          <button
            onClick={() => handleRemove(domain)}
            className="text-red-500 hover:text-red-700"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
};
```

### 3. テーマシステム

#### 3.1 テーマ切り替え機能

- [ ] `src/hooks/use-theme.ts`を作成
- [ ] ライト/ダーク/システムテーマの実装
- [ ] Tailwind CSSのダークモード連携

```typescript
// src/hooks/use-theme.ts

import { useEffect } from 'react';
import { useSettings } from './use-settings';

export const useTheme = () => {
  const { settings, updateSetting } = useSettings();

  useEffect(() => {
    if (!settings) return;

    const applyTheme = (theme: 'light' | 'dark') => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    } else {
      applyTheme(settings.theme);
    }
  }, [settings]);

  const setTheme = async (theme: 'light' | 'dark' | 'system') => {
    await updateSetting('theme', theme);
  };

  return { theme: settings?.theme, setTheme };
};
```

#### 3.2 設定パネルへのテーマセレクタ追加

```typescript
// src/features/sidebar/components/SettingsPanel.tsx（抜粋）

import { useTheme } from '../../../hooks/use-theme';

export const SettingsPanel: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();

  // ...

  return (
    <div className="p-4 space-y-6">
      {/* テーマ設定 */}
      <section>
        <h3 className="font-semibold mb-2">テーマ</h3>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="light">ライト</option>
          <option value="dark">ダーク</option>
          <option value="system">システム</option>
        </select>
      </section>

      {/* サイドバー設定 */}
      <section>
        <h3 className="font-semibold mb-2">サイドバー</h3>

        <label className="block mb-2">
          位置
          <select
            value={settings?.sidebar.position}
            onChange={(e) => updateSetting('sidebar.position', e.target.value)}
            className="w-full px-3 py-2 border rounded mt-1"
          >
            <option value="left">左</option>
            <option value="right">右</option>
          </select>
        </label>

        <label className="block mb-2">
          表示モード
          <select
            value={settings?.sidebar.mode}
            onChange={(e) => updateSetting('sidebar.mode', e.target.value)}
            className="w-full px-3 py-2 border rounded mt-1"
          >
            <option value="fixed">固定</option>
            <option value="auto-hide">自動隠蔽</option>
          </select>
        </label>
      </section>

      {/* 広告ブロック設定 */}
      <section>
        <h3 className="font-semibold mb-2">広告ブロック</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings?.adBlocker.enabled}
            onChange={(e) => updateSetting('ad_blocker.enabled', e.target.checked)}
            className="mr-2"
          />
          広告ブロックを有効にする
        </label>
      </section>
    </div>
  );
};
```

## 技術的課題と解決策

### 課題1: 設定の永続化

**課題**: ユーザー設定をどこに保存するか

**解決策**:
- Tauriの`app_data_dir()`を使用してアプリケーションデータディレクトリを取得
- `settings.json`としてJSON形式で保存
- 起動時に設定を読み込み、Rust側の`State`で管理

**実装例**:
```rust
use tauri::api::path::app_data_dir;
use std::fs;

pub fn load_settings() -> Settings {
    let data_dir = app_data_dir(&config).unwrap();
    let settings_path = data_dir.join("settings.json");

    if settings_path.exists() {
        let content = fs::read_to_string(&settings_path).unwrap();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Settings::default()
    }
}
```

### 課題2: 広告ブロックのパフォーマンス

**課題**: 全てのリクエストをチェックすると遅延が発生する可能性

**解決策**:
- 初期はドメインの単純な文字列マッチのみ（シンプル）
- ブロックリストが大きくなった場合、HashSetを使用して高速化
- 正規表現は避ける（パフォーマンスとミニマリズムの原則）

## 依存関係

**前提条件**: Phase 2のタブ管理、コマンドパレット、サイドバーが完了していること

**後続フェーズへの影響**:
- Phase 4では、設定システムを活用してパフォーマンス設定を追加

## 完了条件

- [ ] 設定システムが動作し、設定が永続化される
- [ ] 設定UIでテーマを変更できる
- [ ] 広告ブロック機能が動作する（ドメインブロックリスト）
- [ ] テーマ（ライト/ダーク/システム）が切り替えられる
- [ ] `docs/rules/minimalism-implementation.md`の原則に準拠している

## テスト項目

### 設定システム

- [ ] 設定を変更して保存すると、再起動後も保持される
- [ ] デフォルト設定が正しく適用される

### 広告ブロック

- [ ] ブロックリストにドメインを追加できる
- [ ] ブロックリストからドメインを削除できる
- [ ] ブロックされたドメインのページが読み込まれない

### テーマ

- [ ] ライト/ダーク/システムテーマが切り替えられる
- [ ] システムテーマがOSの設定に従う

## 参照ドキュメント

- [`docs/rules/minimalism-implementation.md`](../rules/minimalism-implementation.md) - 機能優先順位
- [`docs/rules/ui-design-guidelines.md`](../rules/ui-design-guidelines.md) - サイドバーUI
- [`docs/rules/performance-guidelines.md`](../rules/performance-guidelines.md) - パフォーマンス測定
- [Tauri File System](https://v2.tauri.app/develop/file-system/) - ファイルシステムAPI

## 次のステップ

Phase 3が完了したら、[Phase 4: 磨き上げ](./phase-4-polish.md)に進みます。

Phase 4では、パフォーマンス最適化、バグ修正、ドキュメント整備、テストを行い、一般リリースに向けた品質を確保します。

---

[← Phase 2: コア機能](./phase-2-core-features.md) | [ロードマップ概要](./overview.md) | [Phase 4: 磨き上げ →](./phase-4-polish.md)
