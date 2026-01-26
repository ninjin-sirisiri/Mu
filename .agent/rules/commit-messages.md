# Commit Message Guidelines

This document defines the commit message conventions for the Mu browser project.

## Language

**All commit messages must be written in English.**

## Format

We follow the **Conventional Commits** specification for consistent and semantic commit messages.

### Structure

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

### Scope

Optional. Indicates the area of the codebase affected by the change:

- `ui`: User interface components
- `tabs`: Tab management system
- `command-palette`: Command palette feature
- `sidebar`: Sidebar functionality
- `adblock`: Ad blocking features
- `tauri`: Backend/Rust code
- `config`: Configuration files
- `deps`: Dependency updates

Examples:

```
feat(tabs): add vertical tab layout
fix(command-palette): resolve keyboard navigation bug
refactor(ui): simplify header component structure
```

### Subject

The subject line should:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Not capitalize the first letter
- Not end with a period (.)
- Be limited to 50 characters or less
- Clearly describe what the commit does

✅ Good examples:

```
feat: add keyboard shortcut for new tab
fix: resolve memory leak in tab closure
```

❌ Bad examples:

```
feat: Added keyboard shortcut for new tab.  // Wrong tense, capitalized, has period
Fix: Memory leak fixed  // Capitalized type, unclear
```

## Commit Granularity

**Each commit should represent a single logical change.**

- One feature or one bug fix per commit
- Changes should be atomic and reversible
- Related changes should be grouped together
- Unrelated changes should be in separate commits

✅ Good commit scope:

- Implementing a single feature (e.g., "feat: add tab close button")
- Fixing a specific bug (e.g., "fix: resolve crash on window resize")
- Refactoring a single component or module

❌ Avoid:

- Mixing multiple unrelated features in one commit
- Combining bug fixes with new features
- Very large commits that touch many unrelated files

## Commit Body

The body is **required** for:

1. **Important changes**: Explain WHY the change was needed and HOW it was implemented
2. **Breaking changes**: Must include detailed explanation
3. **Complex changes**: When the subject line alone is insufficient

The body should:

- Be separated from the subject by a blank line
- Wrap lines at 72 characters
- Explain the motivation for the change
- Contrast the new behavior with previous behavior
- **Include related issue numbers** (see Footer section)

Example:

```
feat(adblock): implement EasyList filter support

Add support for EasyList filter syntax to improve ad blocking
coverage. This replaces the previous simple pattern matching
with a more robust rule-based system.

The new implementation uses a trie-based data structure for
efficient pattern matching, reducing memory usage by ~30%.

Refs #42
```

## Footer

### Issue References

**Always include related issue numbers** in the footer:

```
Refs #123
Closes #456
Fixes #789
```

Multiple issues:

```
Refs #123, #124
Fixes #125
```

### Breaking Changes

**Breaking changes must be indicated** in the footer with a `BREAKING CHANGE:` section:

```
feat(api): change tab creation API signature

Update the createTab() function to accept an options object
instead of individual parameters for better extensibility.

BREAKING CHANGE: createTab() now requires an options object.
Previous usage: createTab(url, active)
New usage: createTab({ url, active })

Migrate existing code by wrapping arguments in an object.
```

## Co-Authorship

When working with Claude Code, commits should include:

```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

This is automatically added by the development environment when using the `/commit` command.

## Examples

### Simple feature addition

```
feat(tabs): add vertical tab layout

Refs #23
```

### Bug fix with explanation

```
fix(sidebar): prevent sidebar from hiding on hover

The sidebar was incorrectly hiding when the mouse moved quickly
across it due to a debounce timing issue. Adjusted the hover
detection logic to be more reliable.

Fixes #145
```

### Breaking change with migration guide

```
feat(config): migrate to JSON5 configuration format

Replace TOML configuration with JSON5 to support comments
and trailing commas, improving developer experience.

BREAKING CHANGE: Configuration file format changed from TOML to JSON5.
Existing config.toml files must be converted to config.json5.
Run `mu migrate-config` to automatically convert your configuration.

Closes #78
```

### Refactoring

```
refactor(ui): extract common button styles

Extract repeated button styling logic into reusable Tailwind
components to improve consistency and reduce duplication.

Refs #92
```

## Anti-Patterns to Avoid

❌ **Vague messages**

```
fix: bug fix
feat: update code
chore: changes
```

❌ **Missing type**

```
add new feature
fix the problem
```

❌ **Too verbose subject**

```
feat: implement a new feature that allows users to create vertical tabs in the sidebar
```

❌ **Mixing concerns**

```
feat: add dark mode and fix tab memory leak

// Should be two separate commits
```

❌ **Missing issue reference for related work**

```
feat(tabs): implement tab grouping

// Missing: Refs #XXX
```

## Quick Reference

**Template:**

```
<type>(<scope>): <subject>

[Body explaining WHY and HOW]

[Footer with issue refs and breaking changes]
```

**Common patterns:**

- New feature: `feat(scope): add feature name`
- Bug fix: `fix(scope): resolve specific issue`
- Documentation: `docs: update readme with new info`
- Refactoring: `refactor(scope): improve implementation`
- Breaking change: Include `BREAKING CHANGE:` in footer

**Remember:**

- Write in English
- Use imperative mood ("add", not "added")
- Keep subject under 50 characters
- Include issue numbers
- Explain important changes in body
- Mark breaking changes clearly
