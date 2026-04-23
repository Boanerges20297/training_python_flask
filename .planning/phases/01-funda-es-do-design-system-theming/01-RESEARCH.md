# Phase 1 Technical Research

## Objective
Establish the technical foundation for the new Design System (CSS Modules + Tokens), refactor the ToastProvider, and migrate core UI components, ensuring both Light and Dark modes are supported.

## Current State Analysis
- **Styling:** Currently uses vanilla CSS (`src/index.css`) with global classes like `.app-layout`, `.sidebar`, etc. Dark mode is hardcoded (`background-color: #0f172a`, `color-scheme: dark`).
- **Notifications:** A custom `ToastProvider` exists at `src/components/ui/Toast.tsx`.
- **Components:** There is a `src/components/ui` folder, but it might lack structure or standardization.

## Implementation Strategy

### 1. Design Tokens (CSS Variables)
Create `src/assets/styles/tokens.css` to hold CSS custom properties:
- Define `:root` (Light mode) and `[data-theme="dark"]` or a `.dark` class for Dark mode variables.
- Colors:
  - Client: Light Blue
  - Barber: Amber
  - Services: Green
  - Appointments: Purple
  - Backgrounds: Neutral/vibrant (not pure black).

### 2. CSS Modules setup
Vite supports CSS Modules out of the box for files named `*.module.css`.
- Update `src/components/layouts/AppLayout.tsx` and `src/index.css` to gradually replace global classes with CSS Modules or keep global for `body` reset and use CSS Modules for specific components.

### 3. ToastProvider Refactoring
- The current `Toast.tsx` needs to be updated to use CSS modules (`Toast.module.css`).
- Add smoother entry/exit animations via CSS keyframes within the module.

### 4. Core UI Components Refactoring
- Create base components in `src/components/ui/`: `Button.tsx`, `Input.tsx`, `Modal.tsx`, `Card.tsx`, `Drawer.tsx` (Side-Panel).
- Ensure they all use CSS Modules.

## Validation Architecture
- Verify that `tokens.css` is imported in `main.tsx` or `App.tsx`.
- Verify that `[data-theme="dark"]` variables are correctly applied.
- Verify that the `ToastProvider` is fully functional and styled using modules.
