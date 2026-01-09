# Phase 4: 磨き上げ

[← ロードマップ概要に戻る](./overview.md)

## 目標

パフォーマンス目標を達成し、一般リリースに向けた品質を確保します。パフォーマンス測定と最適化、UX改善、ドキュメント整備、テストを行います。

このフェーズで、Muブラウザは「軽量・ミニマル・没入型」というコンセプトを完全に実現します。

## 成果物

- **パフォーマンス目標達成**（起動1秒、メモリ100MB、バンドル200KB）
- **UX改善**（エッジケース対応、エラーハンドリング）
- **ドキュメント完備**（ユーザーガイド、開発者ドキュメント）
- **テスト完了**（E2Eテスト、ユーザビリティテスト）
- **v1.0.0リリース**: 一般リリース準備完了

## 実装タスク

### 1. パフォーマンス最適化

#### 1.1 パフォーマンス測定

**目標値**:
- **起動時間**: 1秒以内
- **バンドルサイズ**: 200KB以内（minified + gzipped）
- **メモリ使用量**: 100MB以内（アイドル時）

**測定ツールと方法**:

- [ ] 起動時間の測定
  ```rust
  // src-tauri/src/main.rs
  use std::time::Instant;

  fn main() {
      let start = Instant::now();

      mu_lib::run();

      let duration = start.elapsed();
      println!("起動時間: {:?}", duration);
  }
  ```

- [ ] バンドルサイズの測定
  ```bash
  # Viteビルド後
  bun run build
  du -h dist/
  gzip -c dist/assets/*.js | wc -c
  ```

- [ ] メモリ使用量の測定
  - Windowsタスクマネージャー / macOS Activity Monitor
  - Rust: `memory-stats` crateの使用

#### 1.2 起動時間の最適化

- [ ] **Tauri設定の最適化**
  - `tauri.conf.json`で不要なプラグインを削除
  - WebViewの遅延初期化

- [ ] **フロントエンドバンドルの最適化**
  - コード分割（Dynamic Import）の活用
  - 初期ロード時に不要なコンポーネントを遅延読み込み

  ```typescript
  // 例: コマンドパレットの遅延読み込み
  const CommandPalette = React.lazy(() => import('./features/command-palette/CommandPalette'));
  ```

- [ ] **Rustコードの最適化**
  - Release buildでLTO（Link Time Optimization）を有効化
  - `Cargo.toml`の最適化設定

  ```toml
  [profile.release]
  lto = true
  codegen-units = 1
  opt-level = "z"  # サイズ最適化
  strip = true     # シンボル削除
  ```

#### 1.3 バンドルサイズの最適化

- [ ] **Vite設定の最適化**
  ```typescript
  // vite.config.ts
  export default defineConfig({
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
  });
  ```

- [ ] **Tree shakingの確認**
  - 使用していないコードが含まれていないか確認
  - Import文を見直し

- [ ] **依存ライブラリの見直し**
  - 大きなライブラリは自前実装に置き換え
  - バンドルサイズアナライザーで分析
    ```bash
    bun add -d rollup-plugin-visualizer
    ```

#### 1.4 メモリ使用量の最適化

- [ ] **メモリリークの検出と修正**
  - React DevTools Profilerでメモリリークをチェック
  - `useEffect`のクリーンアップ関数を適切に実装

- [ ] **タブの最適化**
  - 非アクティブなタブのWebViewを破棄（一定数以上の場合）
  - タブ切り替え時に再生成

  ```rust
  // タブが10個を超えたら、非アクティブタブを破棄
  if tabs.len() > 10 {
      // 最も古い非アクティブタブを破棄
  }
  ```

### 2. UX改善

#### 2.1 エッジケースへの対応

- [ ] **ネットワークエラー処理**
  - インターネット接続がない場合の適切なエラー表示
  - エラーページのデザイン

- [ ] **無効なURL処理**
  - URLバリデーションの強化
  - サジェスト機能（検索エンジンへのリダイレクト）

- [ ] **空の状態（Empty State）**
  - タブがない状態の表示
  - ブックマーク/履歴がない状態の表示

#### 2.2 エラーハンドリングの強化

- [ ] **Rust側のエラー処理**
  - `Result<T, String>`を全てのコマンドで使用
  - エラーメッセージの統一と明確化

  ```rust
  #[derive(Debug, thiserror::Error)]
  pub enum MuError {
      #[error("タブが見つかりません: {0}")]
      TabNotFound(String),

      #[error("無効なURL: {0}")]
      InvalidUrl(String),

      #[error("設定の読み込みに失敗: {0}")]
      SettingsLoadFailed(String),
  }
  ```

- [ ] **フロントエンド側のエラー処理**
  - Error Boundaryの実装
  - トーストnotificationでエラー表示

#### 2.3 トースト通知の実装

- [ ] `src/components/Toast.tsx`を作成
- [ ] `src/hooks/use-toast.ts`を作成

```typescript
// src/hooks/use-toast.ts

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // 3秒後に自動削除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};
```

#### 2.4 アクセシビリティ改善

- [ ] **キーボードナビゲーション**
  - 全ての操作がキーボードで可能か確認
  - Tab順序の最適化

- [ ] **スクリーンリーダー対応**
  - ARIA属性の追加
  - セマンティックHTMLの使用

- [ ] **フォーカス管理**
  - モーダル開いた時のフォーカストラップ
  - フォーカスインジケーターの視認性向上

### 3. ドキュメント整備

#### 3.1 ユーザーガイド

- [ ] `docs/user-guide.md`を作成
  - インストール方法
  - 基本的な使い方
  - キーボードショートカット一覧
  - コマンドパレットの使い方
  - タブ管理
  - 設定のカスタマイズ
  - FAQ

#### 3.2 開発者向けドキュメント

- [ ] `CONTRIBUTING.md`を作成
  - 開発環境のセットアップ
  - ビルド方法
  - コーディングガイドライン
  - PR作成方法

- [ ] `docs/ARCHITECTURE.md`を作成
  - プロジェクト構造の説明
  - フロントエンド/バックエンドの責任分担
  - 主要モジュールの概要

#### 3.3 README.mdの充実

- [ ] スクリーンショットの追加
- [ ] 機能説明の充実
- [ ] ロードマップセクションの更新
- [ ] バッジの追加（ビルドステータス、ライセンス、バージョン）

### 4. テスト

#### 4.1 E2Eテストの実装

テストフレームワーク: Playwrightまたは手動テスト（初期はミニマルに手動を推奨）

**主要テストケース**:

- [ ] **基本フロー**
  - アプリ起動 → URLを入力 → ページ表示 → ナビゲーション

- [ ] **コマンドパレット**
  - Ctrl+Kでパレット開く → URLを入力 → ページ表示
  - Ctrl+Kでパレット開く → コマンド検索 → コマンド実行

- [ ] **タブ管理**
  - 新しいタブを作成 → 複数タブを切り替え → タブを閉じる

- [ ] **設定**
  - サイドバー位置を変更 → 再起動後も保持される
  - テーマを変更 → UIが更新される

#### 4.2 ユーザビリティテスト

- [ ] 5-10人のユーザーに実際に使ってもらう
- [ ] フィードバックを収集し、UX改善に反映
- [ ] 特に「ミニマリズム」が達成できているか確認

#### 4.3 パフォーマンステスト

- [ ] 複数のマシン（Windows, macOS, Linux）でパフォーマンスを測定
- [ ] 起動時間、メモリ使用量、バンドルサイズが目標値以内か確認
- [ ] ボトルネックがあれば特定し、最適化

### 5. リリース準備

#### 5.1 バージョン管理

- [ ] `package.json`のバージョンを`1.0.0`に更新
- [ ] `Cargo.toml`のバージョンを`1.0.0`に更新
- [ ] `tauri.conf.json`のバージョンを`1.0.0`に更新

#### 5.2 CHANGELOGの作成

- [ ] `CHANGELOG.md`を作成
  - v1.0.0の変更内容をまとめる
  - 各フェーズでの主要機能を記載

#### 5.3 ビルドとパッケージング

- [ ] 各プラットフォーム用のビルドを作成
  ```bash
  bun run tauri build
  ```

- [ ] インストーラーのテスト（Windows MSI, macOS DMG, Linux AppImage/deb）

## 技術的課題と解決策

### 課題1: パフォーマンス目標の達成

**課題**: 起動時間1秒、メモリ100MBは厳しい目標

**解決策**:
- Rustのリリースビルド最適化（LTO、opt-level="z"）
- Viteのバンドル最適化（Tree shaking、コード分割）
- 不要な依存ライブラリの削除
- 遅延読み込みの活用

**妥協点**: 目標に数パーセント届かない場合でも、既存ブラウザと比較して十分軽量であればOK

### 課題2: クロスプラットフォームテスト

**課題**: 全てのプラットフォームでテストするリソースがない

**解決策**:
- 開発者が使用するメインプラットフォームで徹底的にテスト
- CI/CDでビルドテストを自動化
- コミュニティからのフィードバックを積極的に受け入れる

## 依存関係

**前提条件**: Phase 1-3の全機能が完了していること

**後続**: v1.0.0リリース後の継続的改善

## 完了条件

- [ ] **パフォーマンス目標達成**
  - 起動時間: 1秒以内（または既存ブラウザの50%以下）
  - バンドルサイズ: 200KB以内（gzipped）
  - メモリ使用量: 100MB以内（アイドル時）

- [ ] **UX改善完了**
  - エッジケース対応完了
  - エラーハンドリング実装完了
  - トースト通知実装完了
  - アクセシビリティ基準を満たす

- [ ] **ドキュメント完備**
  - ユーザーガイド作成完了
  - 開発者向けドキュメント作成完了
  - README.md充実

- [ ] **テスト完了**
  - 主要機能のE2Eテスト完了
  - ユーザビリティテスト実施
  - パフォーマンステスト完了

- [ ] **リリース準備完了**
  - バージョン1.0.0に更新
  - CHANGELOG作成
  - 各プラットフォームのビルド完了

## テスト項目

### パフォーマンス

- [ ] 起動時間が目標値以内
- [ ] バンドルサイズが目標値以内
- [ ] メモリ使用量が目標値以内
- [ ] タブ切り替えが滑らか（60fps）

### UX

- [ ] エラーメッセージが分かりやすい
- [ ] 全ての操作がキーボードで可能
- [ ] モーダルのフォーカス管理が適切

### ドキュメント

- [ ] ユーザーガイドで基本操作を理解できる
- [ ] 開発者向けドキュメントで開発環境をセットアップできる

## 参照ドキュメント

- [`docs/rules/performance-guidelines.md`](../rules/performance-guidelines.md) - パフォーマンス測定方法
- [`docs/rules/minimalism-implementation.md`](../rules/minimalism-implementation.md) - 最適化の判断基準
- [Tauri Performance](https://v2.tauri.app/develop/performance/) - Tauriパフォーマンスガイド

## v1.0.0リリース後

Phase 4完了後、v1.0.0をリリースします。その後は以下の活動に移行します。

- **継続的改善**: ユーザーフィードバックに基づくバグ修正と小規模改善
- **コミュニティ構築**: Issue対応、PR レビュー
- **将来の拡張検討**: モバイル対応、ブックマーク機能、履歴機能など

詳細は`implementation-notes.md`でリリース後の知見を記録していきます。

---

[← Phase 3: 高度な機能](./phase-3-advanced-features.md) | [ロードマップ概要](./overview.md)
