# SPEC.md — Project Specification

> **Status**: `FINALIZED`
> **Project**: Mu Browser
> **Version**: v1.0

## Vision

「多機能で重い」現代のブラウザへのアンチテーゼとして、**軽量・ミニマル・没入型**のWebブラウザを開発する。Tauri v2とOS標準WebViewを活用し、ユーザーが「読む」「調べる」ことに集中できる環境を提供する。

## Goals

1. **Core Browsing** — URLを入力してWebページを正しく表示できる
2. **Tab Management** — 複数タブの作成・切り替え・閉じるが快適に行える
3. **Command-Driven UI** — コマンドパレットで主要操作が完結する
4. **Keyboard-First** — マウスを使わずとも操作できる

## Non-Goals (Out of Scope for v1.0)

- サイドバーの右側配置オプション
- サイドバーの自動隠蔽（Auto-hide）機能
- 広告ブロック機能
- ブックマーク管理
- 履歴機能
- ドラッグ&ドロップによるタブ並べ替え
- モバイル対応（iOS/Android）
- 設定のエクスポート/インポート

## Users

- **Primary**: 開発者、ライター、研究者
  - Web上の情報収集や長文読解を行う
  - 効率的なキーボード操作を好む
- **Secondary**: 既存ブラウザのメモリ消費や動作の重さに不満を持つユーザー

## Technical Stack

| Layer            | Technology           |
| ---------------- | -------------------- |
| Core Framework   | Tauri v2             |
| Backend          | Rust                 |
| Frontend         | SolidJS + TypeScript |
| Styling          | Tailwind CSS         |
| State Management | @simple-stack/store  |
| Rendering        | OS Native WebView    |

## Constraints

- **Technical**:
  - OS標準WebViewに依存（Windows: WebView2, macOS: WKWebView, Linux: WebKitGTK）
  - Tauri v2のAPIに制限される
- **Performance**:
  - 起動速度: 1秒以内（コールドスタート）
  - メモリ使用量: アイドル時はChrome比で大幅削減を目指す
- **Privacy**:
  - 閲覧履歴や行動データを外部送信しない

## UI Components (v1.0)

### 1. Sidebar（左側固定）
- タブリスト（垂直表示）
- 新規タブボタン
- （将来的に設定アイコン、ブックマーク追加予定）

### 2. Command Palette（`Ctrl+K`で起動）
- URL入力
- Web検索
- タブ操作（新規、閉じる、切り替え）
- 設定アクセス

### 3. WebView Area
- 選択中タブのWebページを表示
- ナビゲーション制御（戻る、進む、リロード）

## Keyboard Shortcuts (v1.0)

| Shortcut   | Action                 |
| ---------- | ---------------------- |
| `Ctrl+K`   | コマンドパレットを開く |
| `Ctrl+T`   | 新規タブを開く         |
| `Ctrl+W`   | 現在のタブを閉じる     |
| `Ctrl+1-9` | N番目のタブに切り替え  |
| `Ctrl+R`   | ページをリロード       |

## Success Criteria

- [ ] URLを入力してWebページを正常に表示できる
- [ ] 複数タブを開いて自由に切り替えられる
- [ ] コマンドパレットでURL入力・検索・タブ操作ができる
- [ ] 上記ショートカットキーがすべて動作する
- [ ] アプリが1秒以内に起動する
- [ ] サイドバーにタブが垂直リスト表示される

---

*Last Updated: 2026-01-26*
