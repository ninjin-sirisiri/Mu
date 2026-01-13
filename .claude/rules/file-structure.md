# File Structure Guidelines

このドキュメントは、Muプロジェクトのファイル構造とディレクトリ編成に関するルールを定義します。

## 基本原則

- **最小限主義**: 必要最小限のファイルとフォルダのみを作成する
- **明確な責任**: 各ディレクトリは明確な役割を持つ
- **発見しやすさ**: 一貫した命名規則により、ファイルを素早く見つけられるようにする

## プロジェクト全体構造

```
Mu/
├── src/                    # フロントエンド（React/TypeScript）
│   ├── components/         # 共通UIコンポーネント
│   ├── features/           # 機能別モジュール
│   ├── hooks/              # 共通カスタムhooks
│   ├── utils/              # 共通ユーティリティ関数
│   ├── types/              # TypeScript型定義の集約
│   ├── assets/             # 共通assets（画像、アイコンなど）
│   ├── App.tsx             # アプリケーションルート
│   ├── main.tsx            # エントリーポイント
│   └── vite-env.d.ts       # Vite型定義
├── src-tauri/              # バックエンド（Rust/Tauri）
│   ├── src/
│   │   ├── modules/        # 機能別モジュール（tabs, webview, storageなど）
│   │   ├── lib.rs          # ライブラリエントリーポイント、Tauriビルダー設定
│   │   └── main.rs         # バイナリエントリーポイント
│   ├── Cargo.toml
│   └── build.rs
├── public/                 # 静的ファイル（ビルド時にそのままコピーされる）
├── docs/                   # ドキュメント
│   └── rules/              # コーディングルール・ガイドライン
└── dist/                   # ビルド成果物（.gitignore対象）
```

## フロントエンド（React/TypeScript）

### ディレクトリ構造

#### ハイブリッド構造の採用

共通コンポーネントは`components/`に、機能固有のコードは`features/`に配置する。

```
src/
├── components/             # 再利用可能な共通UIコンポーネント
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── features/               # 機能別モジュール
│   ├── tabs/
│   │   ├── components/     # タブ機能専用コンポーネント
│   │   │   ├── TabItem.tsx
│   │   │   └── TabList.tsx
│   │   ├── hooks/          # タブ機能専用hooks
│   │   │   └── use-tab-navigation.ts
│   │   ├── utils/          # タブ機能専用ユーティリティ
│   │   │   └── tab-sorting.ts
│   │   ├── assets/         # タブ機能専用assets
│   │   │   └── tab-icon.svg
│   │   ├── TabContainer.tsx
│   │   ├── TabContainer.test.tsx
│   │   └── index.ts        # 公開APIのエクスポート
│   ├── command-palette/
│   │   ├── components/
│   │   ├── CommandPalette.tsx
│   │   └── index.ts
│   └── ad-blocker/
│       └── ...
├── hooks/                  # 共通カスタムhooks
│   ├── use-keyboard.ts
│   └── use-theme.ts
├── utils/                  # 共通ユーティリティ関数
│   ├── string-helpers.ts
│   └── format.ts
├── types/                  # TypeScript型定義の集約
│   ├── index.ts
│   ├── tabs.d.ts
│   └── commands.d.ts
├── assets/                 # 共通assets
│   ├── icons/
│   └── images/
├── App.tsx
└── main.tsx
```

### 命名規則

#### ファイル命名

- **コンポーネント**: PascalCase（例: `CommandPalette.tsx`, `TabItem.tsx`）
- **hooks**: kebab-case、`use-`プレフィックス（例: `use-keyboard.ts`, `use-tab-state.ts`）
- **utils**: kebab-case（例: `string-helpers.ts`, `url-parser.ts`）
- **types**: kebab-case（例: `tabs.d.ts`, `command-palette.d.ts`）
- **テストファイル**: 対応するファイル名 + `.test.tsx`（例: `Button.test.tsx`）

#### フォルダ命名

- 全て**kebab-case**（例: `command-palette/`, `ad-blocker/`, `tab-navigation/`）

### features/ モジュールの構成規則

各機能モジュールは以下の構造を持つことができます:

```
features/機能名/
├── components/         # （オプション）機能専用コンポーネント
├── hooks/              # （オプション）機能専用hooks
├── utils/              # （オプション）機能専用ユーティリティ
├── assets/             # （オプション）機能専用assets
├── [メインコンポーネント].tsx
├── [メインコンポーネント].test.tsx
└── index.ts            # 公開APIのエクスポート（必須）
```

- `index.ts`は機能の公開APIを定義し、外部から使用する要素のみをエクスポートする
- 内部実装の詳細は`index.ts`に含めず、カプセル化を維持する

### 共通 vs 機能固有の判断基準

#### components/に配置すべきもの

- 複数の機能で再利用される汎用UIコンポーネント
- プロジェクト全体で一貫したデザインシステムの一部
- 例: Button, Input, Modal, Dropdown

#### features/に配置すべきもの

- 特定の機能にのみ関連するコンポーネント
- その機能のビジネスロジックを含むコンポーネント
- 例: TabContainer, CommandPalette, AdBlockerSettings

#### hooks/に配置すべきもの（共通）

- 複数の機能で再利用される汎用hooks
- 例: use-keyboard, use-theme, use-local-storage

#### features/[機能]/hooks/に配置すべきもの

- その機能にのみ関連するhooks
- 例: use-tab-navigation, use-command-search

### テストファイル

- テストファイルは**対応するファイルと同じフォルダ**に配置する
- 命名規則: `[ファイル名].test.tsx` または `[ファイル名].test.ts`
- 例:
  ```
  components/
  ├── Button.tsx
  └── Button.test.tsx

  features/tabs/
  ├── TabContainer.tsx
  └── TabContainer.test.tsx
  ```

### 型定義ファイル

- すべての型定義は`src/types/`に集約する
- 機能別に分割する（例: `tabs.d.ts`, `commands.d.ts`, `storage.d.ts`）
- `src/types/index.ts`ですべての型をre-exportする

```typescript
// src/types/tabs.d.ts
export interface Tab {
  id: string;
  url: string;
  title: string;
}

export interface TabGroup {
  id: string;
  tabs: Tab[];
}

// src/types/index.ts
export * from './tabs';
export * from './commands';
export * from './storage';
```

### スタイリング

- **Tailwind CSSのみを使用する**
- 個別のCSSファイル（`.css`, `.module.css`など）は作成しない
- 例外: グローバルスタイル（`src/App.css`）やTailwindの設定に必要な最小限のCSS

### Assets

- **共通assets**: `src/assets/`に配置
- **機能固有assets**: 各`features/[機能]/assets/`に配置
- サブフォルダで整理（例: `icons/`, `images/`, `fonts/`）

## バックエンド（Rust/Tauri）

### ディレクトリ構造

機能別モジュールを採用し、各機能を独立したモジュールとして管理する。

```
src-tauri/src/
├── modules/
│   ├── tabs/
│   │   ├── mod.rs          # モジュールの公開API
│   │   ├── commands.rs     # Tauriコマンド
│   │   ├── models.rs       # データモデル
│   │   └── utils.rs        # ユーティリティ関数
│   ├── webview/
│   │   ├── mod.rs
│   │   └── commands.rs
│   ├── storage/
│   │   ├── mod.rs
│   │   └── commands.rs
│   └── ad_blocker/
│       ├── mod.rs
│       └── commands.rs
├── lib.rs                  # Tauriビルダー設定、全モジュールの統合
└── main.rs                 # バイナリエントリーポイント
```

### modules/ モジュールの構成規則

各機能モジュールは以下の構造を持つことができます:

```
modules/機能名/
├── mod.rs              # モジュールの公開API（必須）
├── commands.rs         # Tauriコマンド（必須）
├── models.rs           # （オプション）データ構造、型定義
├── utils.rs            # （オプション）ユーティリティ関数
├── state.rs            # （オプション）状態管理
└── tests.rs            # （オプション）ユニットテスト
```

- `mod.rs`はモジュールの公開APIを定義し、外部から使用する要素のみを公開する
- `commands.rs`にはTauriコマンド（`#[tauri::command]`）を定義する
- テストは各ファイル内に`#[cfg(test)]`モジュールとして記述するか、`tests.rs`に分離する

### lib.rsの構造

```rust
// src-tauri/src/lib.rs
mod modules;

use modules::{tabs, webview, storage, ad_blocker};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            tabs::commands::create_tab,
            tabs::commands::close_tab,
            webview::commands::navigate,
            storage::commands::save_data,
            ad_blocker::commands::update_filters,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 命名規則

- **モジュール名**: snake_case（例: `ad_blocker`, `tab_navigation`）
- **ファイル名**: snake_case（例: `commands.rs`, `models.rs`）
- **関数名**: snake_case（例: `create_tab`, `update_filters`）
- **構造体名**: PascalCase（例: `TabState`, `AdBlockerConfig`）

## ドキュメント

### docs/ 構造

```
docs/
├── rules/                  # コーディングルール・ガイドライン
│   ├── coding-guidelines.md
│   ├── file-structure.md
│   └── ...
├── requirements.md         # 要件定義
└── architecture.md         # アーキテクチャ設計（将来追加される可能性）
```

- 新しいルールやガイドラインは`docs/rules/`に個別のマークダウンファイルとして追加する
- `CLAUDE.md`は簡潔に保ち、詳細なルールは`docs/rules/`に分離する

## ファイル作成時のチェックリスト

新しいファイルやフォルダを作成する前に、以下を確認する:

### フロントエンド

- [ ] このコンポーネントは共通か、機能固有か？
- [ ] 同じ機能を持つファイルが既に存在しないか？
- [ ] 命名規則に従っているか？（コンポーネント: PascalCase、その他: kebab-case）
- [ ] テストファイルは同じフォルダに作成するか？
- [ ] 型定義は`src/types/`に追加するか？
- [ ] features/モジュールに`index.ts`でエクスポートを定義しているか？

### バックエンド

- [ ] この機能は既存のモジュールに追加すべきか、新しいモジュールを作成すべきか？
- [ ] Tauriコマンドは`commands.rs`に定義しているか？
- [ ] モジュールの公開APIは`mod.rs`で適切に定義しているか？
- [ ] `lib.rs`の`invoke_handler`に新しいコマンドを登録したか？

## 例: 新機能追加の流れ

### 例1: 新しいタブ機能の追加

1. **フロントエンド**: `src/features/tabs/`を作成
   ```
   src/features/tabs/
   ├── components/
   │   ├── TabItem.tsx
   │   └── TabList.tsx
   ├── hooks/
   │   └── use-tab-state.ts
   ├── TabContainer.tsx
   ├── TabContainer.test.tsx
   └── index.ts
   ```

2. **型定義**: `src/types/tabs.d.ts`を作成
   ```typescript
   export interface Tab {
     id: string;
     url: string;
     title: string;
   }
   ```

3. **バックエンド**: `src-tauri/src/modules/tabs/`を作成
   ```
   src-tauri/src/modules/tabs/
   ├── mod.rs
   ├── commands.rs
   └── models.rs
   ```

4. **統合**: `lib.rs`にコマンドを登録

### 例2: 共通Buttonコンポーネントの追加

1. **共通コンポーネント**: `src/components/Button.tsx`を作成
2. **テスト**: `src/components/Button.test.tsx`を作成
3. **型定義**: 必要に応じて`src/types/components.d.ts`に追加

## 禁止事項

- `src/`直下に機能固有のコンポーネントを配置しない（`components/`または`features/`を使用）
- 機能別フォルダ内に`styles/`フォルダを作成しない（Tailwindを使用）
- `src-tauri/src/`直下にモジュールファイルを増やさない（`modules/`を使用）
- テストファイルを別フォルダ（`__tests__/`など）に配置しない
- 型定義を各ファイルに分散させず、`src/types/`に集約する

## 将来の拡張

プロジェクトが成長した場合、以下の拡張を検討する:

- `src/contexts/`: React Contextの管理（状態管理が複雑になった場合）
- `src/constants/`: 定数の集約（マジックナンバーが増えた場合）
- `src/services/`: 外部APIやサービスとの統合（APIクライアントが必要な場合）
- `src-tauri/src/modules/*/tests/`: 統合テスト（ユニットテストが増えた場合）

これらは必要になった時点で追加し、最小限主義の原則を維持する。
