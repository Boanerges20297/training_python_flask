# CONCERNS

## Technical Debt & Architecture
- **Styling Architecture:** The current styling is global Vanilla CSS (`index.css`) which is functional for an MVP but not scalable for a complex application. A major UX/UI refactor is planned to elevate the design to a professional, senior-level standard.
- **Missing Automated Tests:** The absence of a formal testing suite (Jest/Vitest) means all testing is manual. This could lead to regressions, especially during the upcoming styling refactor.

## Known Issues (from past interactions)
- **UI/Routing Bugs:** There have been historical issues with static screens and loading misalignments that need to be monitored during the UX/UI refactor.
- **Backend Alignment:** Need to ensure that the MSW mock definitions (`src/mocks/db.ts`) stay perfectly synchronized with the actual Flask backend, especially regarding ID types (string vs number) and RESTful URL patterns.
- **Security:** Ensure the CSRF token interceptor remains intact and functional after the architectural refactoring.

## Performance
- **Lazy Loading:** Routes are currently lazy-loaded (`React.lazy`), which is good, but the overall bundle size and performance should be re-evaluated after the UX/UI refactor is complete.
