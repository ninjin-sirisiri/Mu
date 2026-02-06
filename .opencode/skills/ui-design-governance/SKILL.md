---
name: ui-design-governance
description: Define and enforce project UI rules for a minimal, flat, modern consumer product on Tauri + Solid. Use this skill when designing or reviewing screens, components, tokens, layout behavior, motion, and accessibility to ensure consistent design decisions, WCAG AA compliance, and implementation-ready output.
---

# UI Design Governance

Use this skill to produce consistent, implementation-ready UI decisions.

## Product Direction

- Build for a consumer-facing product.
- Keep visual style minimal, flat, and modern.
- Prioritize desktop first, then adapt to mobile.
- Use Tauri + Solid constraints in component and layout decisions.
- Treat WCAG AA as a hard quality gate.

## Core Rules

### 1) Direction Guard

- Keep one primary task per screen.
- Use whitespace and typography for hierarchy before adding decoration.
- Avoid ornamental visuals that do not support task completion.
- Prefer predictable flows and obvious CTA placement.

### 2) Token System (single source of truth)

Use token values directly below. Do not hardcode visual values in components.

```css
:root {
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-500: #38bdf8;
  --color-primary-700: #0369a1;

  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0f172a;
  --color-text-muted: #475569;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  --shadow-floating: 0 4px 12px rgba(15, 23, 42, 0.1);
  --shadow-floating-strong: 0 8px 20px rgba(15, 23, 42, 0.14);

  --motion-duration-fast: 180ms;
  --motion-duration-base: 220ms;
  --motion-duration-slow: 240ms;
  --motion-ease-standard: ease-out;
}
```

### 3) Typography

- Heading: "M PLUS 2", "Noto Sans JP", sans-serif
- Body: "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif
- Heading weight: 600-700
- Body weight: 400-500
- Letter spacing: 0 to 0.01em

### 4) Responsive Layout

- Use breakpoints: 1280, 1024, 768, 480.
- Design desktop first; reduce density gradually on smaller viewports.
- Collapse low-priority metadata before primary actions.
- Keep key user task reachable within 3 interactions on each breakpoint.

### 5) Components for Solid

For each component, define:

- Props and value constraints
- Visual states: default, hover, focus, disabled, error, loading
- Keyboard behavior and focus order
- ARIA/label requirements

### 6) Shadow Rules

- Keep shadows very subtle.
- Allow shadows only on floating UI: modal, dropdown, toast.
- Do not use persistent shadows on standard cards and standard buttons.

### 7) Motion Rules

- Keep motion minimal and functional.
- Use 180-240ms duration and ease-out.
- Use state-change motion (opacity/color) before movement.
- Page transitions: fade only. No slide-based page transitions.
- Keep motion tokenized to allow future reduced-motion support.

### 8) Consumer Copy Tone

- Use short, clear, action-oriented microcopy.
- Avoid technical jargon; add brief explanation when needed.
- Prefer direct CTA labels (for example: "保存する", "続ける", "やり直す").

## Accessibility Gate (WCAG AA)

Do not mark work complete unless all checks pass:

- Color contrast meets AA for text and UI controls.
- Full keyboard operation works for primary flows.
- Focus indicator is visible and consistent.
- Inputs have clear labels, errors, and assistive text.
- Reading and tab order match visual and logical flow.

If any check fails, return:

1. Failed item
2. Evidence (where/why)
3. Concrete fix

## Required Output Format

When proposing UI decisions, output in this order:

1. Screen goal and main task
2. Layout structure by breakpoint
3. Token usage (colors/type/spacing/radius/shadow/motion)
4. Component specs (states + a11y)
5. Motion behavior
6. WCAG AA checklist result (pass/fail)
7. Rationale (1-2 short sentences)

Keep output concise and implementation-ready.
