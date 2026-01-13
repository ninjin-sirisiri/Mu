# AGENTS.md

This file provides working rules for Codex when modifying this repo.

## Project overview
- Mu is a minimalist, keyboard-first web browser built with Tauri.
- Frontend: React 19 + TypeScript + Tailwind CSS 4.
- Backend: Rust (Tauri 2.x).

## Philosophy
- Prefer minimalism over features; avoid visual noise.
- Keep UI keyboard-centric and content-focused.
- Performance is a primary constraint; avoid unnecessary re-renders and large deps.

## Coding standards
- TypeScript: strict types, no `any`, function components only, hooks for state.
- React: keep components single-purpose; extract custom hooks when logic grows.
- Rust: use `Result` for fallible ops; avoid `unwrap`/`expect` in production.
- Comments: only for non-obvious logic; explain why, not what.

## File structure
- Follow the hybrid layout in `src/` (components, features, hooks, utils, types).
- Feature modules must export public API via `index.ts`.
- Tests live alongside the file under test; no separate `__tests__` folders.
- Use Tailwind CSS only; avoid new CSS files except minimal globals.

## UI design
- Keep the palette minimal (3-4 colors); accent only for key actions.
- Avoid decorative animations, gradients, blur, and heavy shadows.
- Keep UI compact and high-density; prioritize keyboard navigation and a11y.

## Performance
- Use memoization and lazy loading when it reduces work.
- Avoid unnecessary allocations/clones in Rust and redundant renders in React.
- Be cautious adding dependencies; prefer small, native implementations.

## Error handling
- Wrap async calls in try/catch and show user-friendly toasts.
- Log technical details to the console for debugging.
- Tauri commands should return `Result` and propagate errors with context.

## Commits
- Use Conventional Commits with English messages and appropriate scope.
- Keep commits atomic; include issue references when relevant.

## References
- `CLAUDE.md`
- `.claude/rules/coding-guidelines.md`
- `.claude/rules/file-structure.md`
- `.claude/rules/minimalism-implementation.md`
- `.claude/rules/performance-guidelines.md`
- `.claude/rules/ui-design-guidelines.md`
- `.claude/rules/error-handling.md`
- `.claude/rules/commit-messages.md`
