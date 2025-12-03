# Project Overview
**Project Name:** Mu
**Description:** A lightweight, minimalistic, and immersive web browser designed to eliminate feature bloat and focus on content.
**Goal:** To provide a fast, memory-efficient browsing experience with a focus on keyboard operations and a clean UI.

# Tech Stack
- **Runtime/Package Manager:** Bun
- **Core Framework:** Tauri v2 (Rust + WebView)
- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Simple Stack Store (planned)
- **Backend:** Rust

# Key Files
- **package.json**: Defines project dependencies and scripts (`dev`, `start`, `build`).
- **README.md**: General project information, installation guide, and roadmap.
- **requirements.md**: Detailed functional and non-functional requirements, including UI/UX specs and target platforms.
- **src/index.ts**: Entry point for the Bun development server.
- **src/frontend.tsx**: Entry point for the React application, handling DOM rendering and HMR.
- **src/App.tsx**: Main React component (currently minimal).
- **src-tauri/tauri.conf.json**: Tauri configuration file.

# Folder Structure
- **src/**: Contains the frontend source code (React, TypeScript, CSS).
  - `App.tsx`: Main application component.
  - `frontend.tsx`: React root rendering.
  - `index.ts`: Bun server setup.
  - `index.css`: Global styles.
- **src-tauri/**: Contains the Rust backend code and Tauri configuration.
  - `src/`: Rust source files (`main.rs`, `lib.rs`).
  - `tauri.conf.json`: Configuration for the Tauri application.
- **docs/**: Documentation files.
- **dist/**: Build output directory.

# Project Rules & Guidelines
1.  **Package Management**: Use `bun` for installing dependencies and running scripts.
2.  **Language**:
    - Frontend: TypeScript (`.tsx`, `.ts`)
    - Backend: Rust (`.rs`)
3.  **Styling**: Use Tailwind CSS for styling components.
4.  **Component Structure**: (Inferred) React components should be modular.
5.  **Development**:
    - Run `bun run dev` (or `bun run tauri dev` as per README) to start the development server.
    - Follow `requirements.md` for implementing features like Command Palette, Sidebar, etc.
6.  **Documentation**: Keep `README.md` and `requirements.md` updated as features are implemented.
7.  **UI WebView Architecture**: When creating new UI elements, create a dedicated WebView for that UI and display it there rather than embedding everything in a single view.