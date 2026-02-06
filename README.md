# Mu

> Minimal, lightweight desktop browser — inspired by 「無」 (Mu): fewer features, less friction.

![Mu Logo](public/logo.png)

## Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Non-Goals (MVP)](#non-goals-mvp)
- [Screenshots](#screenshots)
- [Performance Targets](#performance-targets)
- [Privacy & Telemetry](#privacy--telemetry)
- [Data Storage](#data-storage)
- [Getting Started](#getting-started)
  - [Install](#install)
  - [Build from Source](#build-from-source)
- [Usage](#usage)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Clear Browsing Data](#clear-browsing-data)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## About

**Mu** is a minimal desktop browser focused on **lightweight performance** and **a small surface area**.
It uses OS-provided WebView engines (via Tauri) to keep the app lean while staying compatible with mainstream websites.

**Primary UI idea**

- No permanent address bar.
- Press **Ctrl+T** to open a centered input modal (URL or search) — similar to a command palette workflow.

---

## Key Features

### MVP

- **Vertical tabs** (simple list)
- **Sidebar** with:
  - Vertical tabs
  - Back / Forward / Reload
- **Ctrl+T** input modal:
  - URL or search
  - Suggestions from **history & bookmarks**
- **Session restore** (restore previous tabs at launch)
- History retention: **90 days** (plus manual delete)
- Downloads:
  - Choose destination
  - Progress display
  - Pause/Resume
  - Retry
- **HTTP warning** interstitial (Back / Continue)
- Themes: **Light / Dark**
- “Clear browsing data” (history + cookies + cache + site data)

### Built with

- Tauri (Rust)
- Solid + TypeScript
- Bun (tooling)

---

## Non-Goals (MVP)

- Extensions
- Multiple profiles
- Built-in ad blocker (maybe later)
- Chrome extension compatibility

---

## Screenshots

<!-- Add real screenshots when ready -->

- Vertical tabs + sidebar:
  - `docs/screenshots/sidebar.png`
- Ctrl+T modal:
  - `docs/screenshots/command-modal.png`
- Downloads UI:
  - `docs/screenshots/downloads.png`

---

## Performance Targets

These targets are **acceptance criteria** for the MVP on the baseline environment:

**Baseline environment**

- Windows 11
- Intel Core i5 class CPU
- 16GB RAM

**Targets**

- Cold start: **≤ 2.0s**
- Memory:
  - Empty tab: **≤ 200MB**
  - 10 tabs: **≤ 600MB**

**10-tab benchmark set**

- google, youtube, wikipedia, github, gmail, chatgpt, gemini, reddit, note, x

> Note: OS WebView differences can affect behavior/performance across platforms. Windows is the primary pass/fail target for MVP.

---

## Privacy & Telemetry

Mu is designed for privacy by default.

- Telemetry is **opt-in** (default **OFF**)
- Collected (when enabled):
  - Performance stats (e.g., startup time, memory samples)
  - Feature usage frequency (counts/aggregates)

- Crash reports:
  - Anonymous
  - (Recommended) follow the same opt-in control as telemetry

---

## Data Storage

Mu stores local data to provide basic browser functionality:

- History (90 days)
- Downloads history
- Session restore state
- Settings

**Sensitive data**

- Passwords are intended to use **OS keychain** (Windows Credential Manager / macOS Keychain / etc.)

---

## Getting Started

### Install

1. Go to **Releases** and download the installer for your OS.
2. Install and launch Mu.

> TODO: Add real release artifacts and exact file names once CI packaging is set up.

### Build from Source

> TODO: Replace placeholders with exact commands once the repo is created.

#### Prerequisites

- Rust toolchain
- Bun
- Platform WebView prerequisites:
  - Windows: WebView2 runtime (usually already installed)
  - macOS: system WebKit
  - Linux: WebKitGTK packages

#### Build

```bash
bun install
bun run tauri dev
```

#### Production build

```bash
bun run tauri build
```

---

## Usage

### Keyboard Shortcuts

- **Ctrl+T**: Open URL/Search modal
- **Esc**: Close modal
- (Recommended)
  - **Ctrl+L** / **Ctrl+K**: Open modal (compat shortcut)
  - **Ctrl+W**: Close tab
  - **Ctrl+Tab** / **Ctrl+Shift+Tab**: Next/Previous tab

> TODO: Confirm exact shortcut mapping in implementation.

### Clear Browsing Data

Settings → Privacy → **Clear browsing data**

MVP clears:

- History
- Cookies
- Cache
- Site data (localStorage, IndexedDB, service worker caches)

> Future: allow selecting which categories to clear.

---

## Roadmap

### Near-term

- Search engine selection (default: Google)
- More granular privacy settings (cookie/site controls)
- Better downloads manager UX

### Later

- Optional ad blocker
- Policy / enterprise controls (best-effort)
- Mobile support (if feasible)

---

## Contributing

Contributions are welcome.

- Use Issues for bugs and feature requests
- PRs should be small and focused
- Please add/update tests where applicable

> TODO: Add `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`

---

## Security

If you discover a security issue, please report it privately.

> TODO: Add `SECURITY.md` with a disclosure process.

---

## License

<!-- TODO: choose a license and add LICENSE file -->

TBD (recommended: MIT or Apache-2.0). Add a `LICENSE` file before the first public release.

---

## Acknowledgements

- Inspired by minimal UI browsers and command-palette workflows (e.g., Arc, Zen Browser)
- README structure inspired by community “awesome README” practices
