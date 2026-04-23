---
wave: 3
depends_on: [1, 2]
files_modified:
  - src/components/ui/Toast.tsx
  - src/components/ui/Toast.module.css
autonomous: true
---

# Wave 3: Sistema de Notificações

## Objective
Refactor the existing Toast notification system to use CSS Modules and the new Design Tokens, featuring smooth animations.

## Requirements
- THEME-03: Refatorar o sistema de Notificações (`ToastProvider`).

## Tasks

```xml
<task>
  <description>Refactor ToastProvider and styling.</description>
  <read_first>
    - src/components/ui/Toast.tsx
  </read_first>
  <action>
    Create `src/components/ui/Toast.module.css`.
    Modify `src/components/ui/Toast.tsx` to import styles from the CSS Module instead of relying on global inline styles or Tailwind/global classes.
    Implement entry (`slide-in-right`) and exit (`fade-out`) keyframe animations in the CSS Module.
    Apply background colors based on toast type using tokens (e.g., success uses `--color-service`, error uses a new `--color-danger` token).
  </action>
  <acceptance_criteria>
    - `src/components/ui/Toast.module.css` contains `@keyframes` for animations.
    - `src/components/ui/Toast.tsx` imports and uses `styles.toastContainer` and `styles.toast`.
  </acceptance_criteria>
</task>
```
