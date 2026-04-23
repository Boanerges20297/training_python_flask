---
wave: 2
depends_on: [1]
files_modified:
  - src/components/ui/Button.tsx
  - src/components/ui/Button.module.css
  - src/components/ui/Input.tsx
  - src/components/ui/Input.module.css
  - src/components/ui/Card.tsx
  - src/components/ui/Card.module.css
  - src/components/ui/Drawer.tsx
  - src/components/ui/Drawer.module.css
autonomous: true
---

# Wave 2: Componentes Core UI com CSS Modules

## Objective
Create the base UI components using CSS Modules, ensuring they consume the newly established design tokens and replace any old global class dependencies.

## Requirements
- CORE-01: Refatorar e mover componentes globais de interface para `src/components/ui`.

## Tasks

```xml
<task>
  <description>Create Button component with variants.</description>
  <read_first>
    - src/assets/styles/tokens.css
  </read_first>
  <action>
    Create `src/components/ui/Button.tsx` and `Button.module.css`.
    Support props like `variant` ('primary', 'secondary', 'danger') and `size` ('sm', 'md', 'lg').
    Use CSS Modules to style the button, consuming variables like `var(--color-client)` for the primary variant.
  </action>
  <acceptance_criteria>
    - `src/components/ui/Button.tsx` exists and exports a `Button` component.
    - `src/components/ui/Button.module.css` contains classes like `.primary` and `.secondary`.
  </acceptance_criteria>
</task>

<task>
  <description>Create Input component.</description>
  <read_first>
    - src/assets/styles/tokens.css
  </read_first>
  <action>
    Create `src/components/ui/Input.tsx` and `Input.module.css`.
    Implement a reusable text input with focus states, error states (red border), and support for labels. Use CSS variables for borders and backgrounds.
  </action>
  <acceptance_criteria>
    - `src/components/ui/Input.tsx` exists and forwards refs correctly.
    - `src/components/ui/Input.module.css` contains focus and error styling.
  </acceptance_criteria>
</task>

<task>
  <description>Create Card component.</description>
  <read_first>
    - src/assets/styles/tokens.css
  </read_first>
  <action>
    Create `src/components/ui/Card.tsx` and `Card.module.css`.
    Implement Card, CardHeader, CardContent, and CardFooter subcomponents. Use `var(--bg-secondary)` for the card background and subtle borders.
  </action>
  <acceptance_criteria>
    - `src/components/ui/Card.tsx` exports `Card` and its subcomponents.
    - `src/components/ui/Card.module.css` applies background and border radius.
  </acceptance_criteria>
</task>

<task>
  <description>Create Drawer (Side-Panel) component.</description>
  <read_first>
    - src/assets/styles/tokens.css
  </read_first>
  <action>
    Create `src/components/ui/Drawer.tsx` and `Drawer.module.css`.
    Implement an accessible side-panel that slides in from the right. This fulfills the UX decision to replace Modals with Drawers. Use CSS transitions for the slide effect.
  </action>
  <acceptance_criteria>
    - `src/components/ui/Drawer.tsx` exists and accepts an `isOpen` prop.
    - `src/components/ui/Drawer.module.css` contains transform transition rules for sliding.
  </acceptance_criteria>
</task>
```
