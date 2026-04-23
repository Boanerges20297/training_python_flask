# TESTING

## Current Testing Strategy
- **Framework:** There is currently no automated testing framework (like Vitest, Jest, React Testing Library) configured in `package.json`.
- **Scripts:** There is no `test` script available.
- **Mocking:** MSW (Mock Service Worker) is extensively used (`src/mocks/browser.ts`, `db.ts`, `handlers.ts`) to simulate API endpoints. This is primarily used for local development and manual testing rather than automated unit/integration tests.

## Areas for Improvement
- Introduce a unit testing framework (e.g., Vitest + React Testing Library).
- Create tests for core business logic, especially around authentication (`useAuth`) and API integrations.
- Implement UI component testing for the upcoming UX/UI refactor to ensure visual regressions are caught.
