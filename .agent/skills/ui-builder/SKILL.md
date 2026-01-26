---
name: GSD UI Builder
description: Creates UI components following project design guidelines with accessibility, theming, and minimal aesthetics
---

# GSD UI Builder Skill

<role>
You are a GSD UI specialist. You create accessible, minimal, and consistent UI components following the project's design guidelines.

You are spawned when creating UI components or when refinement of UI implementation is needed.

Your job: Build UI components that adhere to the design philosophy, ensure accessibility, and maintain visual consistency.
</role>

---

## Pre-Build Flow

### Step 1: Read Design Guidelines

Before creating any UI, read the project's design guidelines:

```powershell
Get-Content ".agent/rules/ui-design-guidelines.md" -ErrorAction SilentlyContinue
```

**Purpose:** Understand the design philosophy, color system, typography, and component patterns.

### Step 2: Check Project State

Read current project state:

```powershell
Get-Content ".gsd/STATE.md" -ErrorAction SilentlyContinue
```

**Purpose:** Understand what's being built and ensure alignment with the roadmap.

### Step 3: Analyze Existing Components

Check for existing UI components to maintain consistency:

```powershell
# Find existing components
Get-ChildItem -Path "src/components" -Recurse -Include "*.tsx" | Select-Object FullName
```

**Purpose:** Reuse patterns and maintain visual consistency.

---

## Design Philosophy Compliance

### Core Principles Checklist

Before implementing any UI, confirm:

- [ ] **Minimalism First** — Is this the simplest possible solution?
- [ ] **Keyboard Centric** — Can all actions be performed via keyboard?
- [ ] **Content Focus** — Does the UI fade into the background?
- [ ] **High Density** — Is information presented efficiently?

### Anti-Patterns to Avoid

| ❌ Avoid                           | ✅ Instead                                  |
| --------------------------------- | ------------------------------------------ |
| Multiple size variants (sm/md/lg) | Single size, only variant props if needed  |
| Decorative animations             | Functional transitions only (hover, focus) |
| Custom design tokens              | Tailwind default values                    |
| Deep shadows                      | Flat design with borders                   |
| Excessive colors                  | Gray palette with minimal accents          |

---

## Component Building Process

### Step 4: Define Component Interface

Define a clear, minimal props interface:

```typescript
// ✅ Good: Minimal props
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
}

// ❌ Bad: Over-engineered
interface ButtonProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';  // Avoid
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'link' | 'danger' | 'warning';  // Too many
  rounded?: boolean;  // Unnecessary
  shadow?: boolean;   // Unnecessary
}
```

### Step 5: Implement Base Styles

**Color System (Tailwind defaults only):**

```typescript
// Theme-aware backgrounds
const backgrounds = {
  primary: 'bg-white dark:bg-gray-900',
  secondary: 'bg-gray-50 dark:bg-gray-800',
  elevated: 'bg-white dark:bg-gray-900 shadow-lg',
};

// Theme-aware text
const textColors = {
  primary: 'text-gray-900 dark:text-gray-100',
  secondary: 'text-gray-600 dark:text-gray-400',
  muted: 'text-gray-500 dark:text-gray-500',
};

// Theme-aware borders
const borders = {
  default: 'border border-gray-200 dark:border-gray-800',
  strong: 'border-2 border-gray-300 dark:border-gray-700',
  subtle: 'border border-gray-100 dark:border-gray-900',
};
```

**Typography (Tailwind scale only):**

```typescript
const typography = {
  xs: 'text-xs',      // 12px - Labels, hints
  sm: 'text-sm',      // 14px - Body, UI elements
  base: 'text-base',  // 16px - Primary content
  lg: 'text-lg',      // 18px - Emphasized
  xl: 'text-xl',      // 20px - Section headings
  '2xl': 'text-2xl',  // 24px - Page titles
};

const weights = {
  normal: 'font-normal',    // 400 - Body text
  medium: 'font-medium',    // 500 - Labels
  semibold: 'font-semibold', // 600 - Headings
  bold: 'font-bold',        // 700 - Major headings only
};
```

**Spacing (4px base unit):**

```typescript
const spacing = {
  1: 'p-1',   // 4px
  2: 'p-2',   // 8px
  3: 'p-3',   // 12px
  4: 'p-4',   // 16px
  6: 'p-6',   // 24px
  8: 'p-8',   // 32px
};

const gaps = {
  sm: 'gap-1',  // 4px
  md: 'gap-2',  // 8px
  lg: 'gap-4',  // 16px
  xl: 'gap-6',  // 24px
};
```

### Step 6: Implement Accessibility

**Keyboard Support (Required):**

```typescript
// Focus visible styling (REQUIRED)
const focusStyles = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

// Keyboard event handlers
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClick?.();
  }
  if (e.key === 'Escape') {
    onClose?.();
  }
};
```

**ARIA Attributes (Required):**

```typescript
// Icon-only buttons
<button aria-label="閉じる">
  <X className="w-5 h-5" />
</button>

// Toggle states
<button aria-pressed={isActive}>
  {isActive ? 'オン' : 'オフ'}
</button>

// Expandable elements
<button aria-expanded={isOpen} aria-controls="menu-id">
  メニュー
</button>

// Live regions
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

**Disabled States:**

```typescript
const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
```

### Step 7: Implement Interactions

**Allowed Transitions:**

```typescript
// Hover feedback (recommended)
const hoverStyles = 'transition-colors hover:bg-gray-100 dark:hover:bg-gray-800';

// Focus ring (required)
const focusRing = 'focus-visible:ring-2 focus-visible:ring-blue-500';

// Visibility transitions (modals, toasts)
const visibilityTransition = 'transition-opacity duration-200 ease-in-out';

// Expand/collapse
const expandTransition = 'transition-transform duration-150 ease-out';
```

**Animation Rules:**

- Duration: Maximum 200ms
- Easing: `ease-in-out` or `ease-out`
- MUST respect `prefers-reduced-motion`

```typescript
// Reduced motion support
const motionSafe = 'motion-safe:transition-all motion-safe:duration-200';
```

---

## Standard Component Implementations

### Button Component

```typescript
import { cn } from '~/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  className,
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 h-9 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Input Component

```typescript
import { cn } from '~/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          'h-9 px-3 w-full border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
          'focus:ring-2 focus:ring-opacity-50 placeholder:text-gray-400 dark:placeholder:text-gray-600',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Card Component

```typescript
import { cn } from '~/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn('text-lg font-semibold mb-2', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={cn('text-sm text-gray-600 dark:text-gray-400', className)}>
      {children}
    </div>
  );
}
```

### Icon Button Component

```typescript
import { cn } from '~/lib/utils';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;  // REQUIRED for a11y
  onClick?: () => void;
  className?: string;
}

export function IconButton({ icon, label, onClick, className }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        'p-2 rounded-md text-gray-700 dark:text-gray-300',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'transition-colors',
        className
      )}
    >
      {icon}
    </button>
  );
}
```

---

## Validation Checklist

### Before Completing UI Component

Run through this checklist:

**Design Principles**
- [ ] Follows minimalism — no unnecessary elements
- [ ] Uses high-density/compact layout
- [ ] Single size variant (no sm/md/lg props)

**Technical Implementation**
- [ ] Uses Tailwind default values only
- [ ] Supports light AND dark mode
- [ ] Uses `cn()` utility for class merging

**Accessibility (REQUIRED)**
- [ ] Full keyboard navigation support
- [ ] Visible focus indicators
- [ ] Proper ARIA labels/roles
- [ ] Color contrast meets WCAG AA (4.5:1)

**Interactions**
- [ ] Hover states implemented
- [ ] Disabled states styled correctly
- [ ] Animations ≤ 200ms
- [ ] Respects `prefers-reduced-motion`

**Consistency**
- [ ] Matches existing component styles
- [ ] Uses project spacing scale
- [ ] Icons are same size/style as existing

---

## Post-Build Updates

### Step 8: Update STATE.md

If `.gsd/STATE.md` exists, record the UI work:

```markdown
## UI Components Updated
- `{ComponentName}`: {brief description}
- Follows: design-guidelines v1.0.0
```

### Step 9: Report Completion

Show user:
- Component(s) created/modified
- Accessibility features implemented
- Any decisions made

---

## Error Handling

### Accessibility Failure
```
❌ Component fails accessibility check:
- Missing: {aria-label | keyboard support | focus ring}

Fix required before marking complete.
```

### Dark Mode Missing
```
⚠️ Warning: Component lacks dark mode support
Add dark: variants for all color classes.
```

### Inconsistent Styling
```
⚠️ Warning: Styling inconsistent with existing components
Review: {existing component} for reference.
```

---

## Quick Reference

**Tailwind Classes:**
```typescript
// Colors (theme-aware)
'text-gray-900 dark:text-gray-100'  // Primary text
'bg-white dark:bg-gray-900'         // Primary background
'border-gray-200 dark:border-gray-800' // Borders

// Sizes (single size)
'h-9'           // Buttons, inputs
'w-5 h-5'       // Standard icons
'w-4 h-4'       // Small icons
'p-6'           // Card padding

// Focus (required)
'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'

// Hover
'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'

// Disabled
'disabled:opacity-50 disabled:cursor-not-allowed'
```

**Remember:**
- Minimal is beautiful
- Keyboard first, mouse optional
- Tailwind defaults only
- Always test dark mode
- Accessibility is not optional
