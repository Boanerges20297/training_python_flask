# Context: Phase 1 — Design System & Professionalism

## Phase Goal
Establish a professional, clean, and intuitive design system for the Barber Shop application, removing "loud" elements and standardizing UI components to support financial decision-making and productivity.

## Decisions

### UI/UX Direction
- **Border Radii (Decision UI-01)**: Standardize global border-radius to a maximum of `0.75rem` (12px) for cards and `0.375rem` (6px) or `0.5rem` (8px) for interactive elements (buttons/inputs). This replaces the current "too rounded" look (e.g., 2.5rem).
- **Visual Style (Decision UI-02)**: Move away from high-contrast gradients and "glow" effects. Adopt a "Flat" design with subtle depth (shadows over glows) to minimize visual noise.
- **Palette (Decision UI-03)**: Use a professional, muted palette (Slate/Zinc bases) for the dashboard, ensuring data clarity for financial metrics.
- **SweetAlert Standardization**: Refactor SweetAlert styles to consume project CSS tokens (same buttons, radii, and fonts) for a seamless experience.

### Business Logic / Intuition
- **Focus**: UI elements must prioritize **productivity** (quick actions, clear status) and **financial clarity** (legible numbers, professional charts).

## Specifics
- **References**: Professional SaaS management tools (Vercel/Stripe style clarity).
- **Constraints**: Must maintain compatibility with existing React components while refactoring the CSS layer.

## Canonical Refs
- `frontend/src/assets/styles/tokens.css` (Source of truth for tokens)
- `frontend/src/index.css` (Global styles)
- `frontend/src/modules/admin/views/DashboardView.tsx` (Primary target for refactoring)

## Folded Todos
- (None)

---
*Context defined: 2026-05-03*
*Status: Ready to Plan*
