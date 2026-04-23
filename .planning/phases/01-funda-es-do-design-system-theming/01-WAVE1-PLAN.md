---
wave: 1
depends_on: []
files_modified:
  - src/assets/styles/tokens.css
  - src/components/providers/ThemeProvider.tsx
  - src/hooks/useTheme.ts
  - src/main.tsx
  - src/index.css
autonomous: true
---

# Wave 1: Infraestrutura de Temas (Theming & Tokens)

## Objective
Establish the foundational design tokens and theming infrastructure to support Light and Dark modes with the new vibrant/neutral palette.

## Requirements
- THEME-01: Implementar o Design System inicial (CSS Modules) e paleta.
- THEME-02: Ajustar o background/tema escuro base (Dark Mode).

## Tasks

```xml
<task>
  <description>Create global design tokens for colors, typography, and spacing.</description>
  <read_first>
    - src/index.css
  </read_first>
  <action>
    Create `src/assets/styles/tokens.css`. 
    Define `:root` with light mode variables (e.g., `--bg-primary: #ffffff`, `--text-primary: #1e293b`).
    Define `[data-theme="dark"]` with dark mode variables (e.g., `--bg-primary: #121214`, `--text-primary: #f8fafc`).
    Include brand colors: `--color-client: #3b82f6` (blue), `--color-barber: #f59e0b` (amber), `--color-service: #10b981` (green), `--color-appointment: #8b5cf6` (purple).
  </action>
  <acceptance_criteria>
    - `src/assets/styles/tokens.css` contains `:root` and `[data-theme="dark"]` selectors.
    - Brand color variables are defined in both themes.
  </acceptance_criteria>
</task>

<task>
  <description>Create ThemeProvider and useTheme hook to manage theme state.</description>
  <read_first>
    - src/main.tsx
  </read_first>
  <action>
    Create `src/hooks/useTheme.ts` and `src/components/providers/ThemeProvider.tsx`.
    The provider should manage 'light' | 'dark' | 'system' state, persist it in localStorage, and apply `data-theme` attribute to `document.documentElement`.
    Wrap `<App />` in `ThemeProvider` within `src/main.tsx` and import `tokens.css`.
  </action>
  <acceptance_criteria>
    - `src/components/providers/ThemeProvider.tsx` is created and sets `data-theme` on the document element.
    - `src/main.tsx` imports `tokens.css` and wraps the app with `ThemeProvider`.
  </acceptance_criteria>
</task>

<task>
  <description>Refactor global CSS to use tokens and remove hardcoded colors.</description>
  <read_first>
    - src/index.css
  </read_first>
  <action>
    Modify `src/index.css`. Keep CSS resets but replace hardcoded colors like `#0f172a` and `#1e293b` with `var(--bg-primary)` and `var(--bg-secondary)`. Replace hardcoded text colors with `var(--text-primary)`.
  </action>
  <acceptance_criteria>
    - `src/index.css` no longer contains hardcoded hex colors for background and text in the `body` and `:root` selectors.
  </acceptance_criteria>
</task>
```
