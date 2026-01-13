# Coding Guidelines

This document defines the coding standards and conventions for the Mu browser project.

## TypeScript/React

### Type Safety

- Use strict type definitions throughout the codebase
- **Prohibit `any` type** - Always provide explicit types
- Leverage TypeScript's type inference, but add annotations where clarity is needed
- Define proper interfaces and types for all props, state, and function parameters

### Component Design

- Use function components exclusively
- Leverage React hooks for state management and side effects
- Create custom hooks to separate logic from presentation when appropriate
- Keep components focused and single-purpose

### Naming Conventions

- **Files**: PascalCase for all files (e.g., `CommandPalette.tsx`, `TabManager.tsx`)
- **Components**: PascalCase (e.g., `CommandPalette`, `TabItem`)
- **Functions/Variables**: camelCase (e.g., `handleKeyPress`, `isTabVisible`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_TABS`, `DEFAULT_THEME`)

### Import Organization

Group and sort imports in the following order:
1. React and external libraries (alphabetically sorted)
2. Internal components (alphabetically sorted)
3. Type definitions (alphabetically sorted)
4. Utilities and helpers (alphabetically sorted)

Separate each group with a blank line.

Example:
```typescript
// External libraries
import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

// Components
import CommandPalette from './CommandPalette'
import TabBar from './TabBar'

// Types
import type { Tab, Command } from './types'

// Utilities
import { debounce } from './utils'
```

### Documentation

- Use TSDoc/JSDoc format for public APIs and complex functions
- Document component props with JSDoc comments
- Add inline comments only for non-obvious logic
- Keep comments concise and focused on "why", not "what"

### Minimalist Principles

- **Performance First**: Avoid unnecessary re-renders using `React.memo`, `useMemo`, `useCallback` judiciously
- **UI Minimization**: Only create UI elements that serve a clear purpose - avoid decorative elements
- Prefer simple, direct implementations over complex patterns
- Minimize external dependencies - only add libraries when truly necessary

## Rust/Tauri

### Error Handling

- Use `Result<T, E>` type for all operations that can fail
- Define custom error types using `thiserror` or similar for detailed error information
- Avoid `unwrap()` and `expect()` in production code - handle errors explicitly
- Propagate errors with `?` operator and provide context at appropriate levels

### Naming Conventions

- **Functions/Variables**: snake_case (e.g., `create_tab`, `tab_count`)
- **Types/Structs**: PascalCase (e.g., `TabManager`, `BrowserWindow`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_HISTORY_SIZE`)

### Documentation

- Use `///` doc comments for public functions and types
- Use `//!` for module-level documentation
- Document all public APIs with usage examples where appropriate
- Include error conditions in function documentation

Example:
```rust
/// Creates a new browser tab with the given URL.
///
/// # Arguments
/// * `url` - The URL to load in the new tab
///
/// # Returns
/// Returns `Ok(TabId)` on success, or `Err(BrowserError)` if tab creation fails
///
/// # Errors
/// - `BrowserError::InvalidUrl` if the URL format is invalid
/// - `BrowserError::MaxTabsReached` if tab limit is exceeded
pub fn create_tab(url: &str) -> Result<TabId, BrowserError> {
    // Implementation
}
```

### Tauri Commands

- Keep command handlers thin - delegate complex logic to separate modules
- Return `Result<T, String>` from commands for proper error handling across FFI boundary
- Document all commands with usage examples for frontend developers

### Performance

- Avoid unnecessary allocations and cloning
- Use references where possible
- Consider async operations for I/O-bound tasks
- Profile and optimize hot paths

## General Principles

### Minimalism in Code

- Write simple, readable code over clever abstractions
- Avoid premature optimization, but be mindful of performance implications
- Delete unused code immediately - don't comment it out
- Question every dependency before adding it

### Performance Considerations

- Measure before optimizing
- Minimize bundle size - tree-shake unused code
- Lazy-load components and modules when appropriate
- Use native platform capabilities (WebView2) effectively

### Code Reviews

When reviewing code, ask:
- Does this align with Mu's minimalist philosophy?
- Is the type safety maintained?
- Are errors handled properly?
- Could this be simpler?
- Does this impact performance negatively?
