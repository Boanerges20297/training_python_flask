# CONVENTIONS

## Code Style
- **Components:** Functional components using hooks. PascalCase for component names and files (e.g., `AppLayout.tsx`).
- **Hooks:** Custom hooks use the `use` prefix (e.g., `useAuth.ts`).
- **File Extensions:** `.tsx` for React components, `.ts` for TypeScript logic files.

## Styling Patterns
- **Current State:** Vanilla CSS with global styles in `index.css`. Uses basic BEM-like class naming (e.g., `.app-layout`, `.sidebar`, `.content-header`).
- **Future State:** Planned to undergo a major UX/UI refactor focusing on a senior-level design system, potentially introducing more modern CSS architectures or utility-first approaches.

## Error Handling & State
- **Toast Notifications:** A custom `ToastProvider` is used for user feedback (`src/components/ui/Toast.tsx`).
- **Loading States:** Uses a `SuspenseFallback` with an animated spinner (`Activity` from `lucide-react`) for lazy-loaded routes.

## API Integration
- **Interceptors:** Axios is used with interceptors to manage CSRF tokens and handle standard API responses (as established in previous backend alignment work).
- **Mocking First:** The `main.tsx` explicitly initializes MSW (`enableMocking()`) before rendering the app, indicating a mock-first development workflow.
