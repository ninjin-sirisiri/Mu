# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mu is a lightweight, minimalistic, and immersive web browser built with Tauri, designed as an antithesis to "feature-rich and heavy" modern browsers. The focus is on simplicity, keyboard-centric operation, and content-focused browsing.

**Key Features:**
- Minimalist design eliminating visual noise
- Lightweight architecture using OS-native rendering engine (WebView2 on Windows)
- Command palette (Ctrl+K / Cmd+K) for navigation instead of traditional address bar
- Vertical tabs in customizable sidebar (left/right placement, auto-hide mode)
- Ad blocking capabilities

## Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Rust (Tauri 2.x framework)
- **Build Tools**: Vite, bun (package manager)
- **State Management**: Simple Stack Store

## Development Commands

**Development:**
```bash
bun run tauri dev
```
This starts both the Vite dev server (on port 1420) and the Tauri application.

**Build for Production:**
```bash
bun run tauri build
```
This compiles TypeScript, builds the frontend with Vite, and creates platform-specific Tauri bundles.

**Frontend Only (without Tauri):**
```bash
bun run dev          # Start Vite dev server
bun run build        # Build frontend (TypeScript check + Vite build)
bun run preview      # Preview production build
```

**Package Management:**
```bash
bun add <package>           # Add dependency
bun add <package> -d        # Add dev dependency
```

**Rust/Tauri:**
```bash
cargo build --manifest-path src-tauri/Cargo.toml              # Build Rust code
cargo build --manifest-path src-tauri/Cargo.toml --release    # Release build
cargo check --manifest-path src-tauri/Cargo.toml              # Quick check
```

## Architecture

### Frontend (React/TypeScript)

- **Entry Point**: `src/main.tsx` - React app initialization
- **Main Component**: `src/App.tsx` - Root application component
- **Styling**: Tailwind CSS 4 (using @tailwindcss/vite plugin)
- **Build Config**: `vite.config.ts` - Configured for Tauri integration with fixed ports (1420 for dev server, 1421 for HMR)

The frontend is minimal and focused. The browser UI is keyboard-centric with a command palette as the primary navigation interface.

### Backend (Rust/Tauri)

- **Entry Point**: `src-tauri/src/main.rs` - Binary entry calling `run()` from lib
- **Core Logic**: `src-tauri/src/lib.rs` - Tauri builder configuration, command handlers, and plugins
- **Library Name**: `mu_lib` (note: uses `_lib` suffix to avoid Windows name conflicts)
- **Build Script**: `src-tauri/build.rs` - Tauri build configuration

**Tauri Commands:**
- Commands are defined in `lib.rs` using `#[tauri::command]` attribute
- Example: `greet(name: &str) -> String` - template greeting command
- Register commands in `tauri::generate_handler![]` macro

**Plugins:**
- `tauri-plugin-opener` - For opening URLs/files with system defaults

### Configuration

- **Tauri Config**: `src-tauri/tauri.conf.json`
  - App identifier: `com.ninjin.mu`
  - Dev command: `bun run dev`
  - Build command: `bun run build`
  - Frontend dist: `../dist`

- **TypeScript**: Strict mode enabled with ES2020 target
  - Uses React JSX transform
  - Bundler module resolution
  - No unused locals/parameters allowed

## Adding New Features

**Frontend (React Component):**
1. Create component in `src/` directory
2. Import and use in `App.tsx` or other components
3. Use Tailwind CSS for styling

**Backend (Tauri Command):**
1. Add command function in `src-tauri/src/lib.rs` with `#[tauri::command]` attribute
2. Register in `tauri::generate_handler![]` macro
3. Call from frontend using `@tauri-apps/api` invoke function

**Adding Dependencies:**
- Frontend: `bun add <package>`
- Backend: Add to `src-tauri/Cargo.toml` under `[dependencies]`

## Project Philosophy

- **Minimalism Over Features**: Avoid bloat, keep UI clean and focused
- **Keyboard-First**: Prioritize keyboard navigation and shortcuts
- **Performance**: Lightweight design using native WebView
- **Content Focus**: Remove distractions to enable deep reading and research

When implementing features, always consider: Does this add complexity that goes against the minimalist philosophy? Can this be achieved with fewer UI elements or simpler interactions?

## Coding Guidelines

**Detailed coding standards and conventions are maintained in separate files under `.claude/rules/` to reduce context size.**

Please refer to:
- `.claude/rules/coding-guidelines.md` - TypeScript/React and Rust/Tauri coding standards

When adding new rules or guidelines, create separate markdown files in the `.claude/rules/` directory rather than adding them to this file.
