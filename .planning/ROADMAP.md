# Roadmap: Barber Shop Improvement

## Overview
This roadmap outlines the transition from the current "unprofessional" state of the Barber Shop application to a high-end, secure, and testable platform. We will focus on standardizing the design system, hardening the authentication layer, and providing robust mock data for development.

## Phases

- [ ] **Phase 1: Design System & Professionalism** - Standardize UI tokens and refactor the global design.
- [ ] **Phase 2: Security Hardening** - Transition to persistent JWT management and claim validation.
- [ ] **Phase 3: Data & Testability** - Implement mock data generation for robust testing.
- [ ] **Phase 4: Dashboard & UX Polishing** - Refactor the dashboard for better intuition and less "loudness".

## Phase Details

### Phase 1: Design System & Professionalism
**Goal**: Establish a professional design baseline and fix the "escandaloso" elements.
**Depends on**: Nothing
**Requirements**: UI-01, UI-02
**Success Criteria**:
  1. Border-radii are standardized (max 0.75rem for cards).
  2. The "scandalous" Swalert radii (2.5rem) are reduced to professional values.
  3. Global color palette is muted and elegant (defined in tokens.css).
**Plans**: 2 plans

Plans:
- [ ] 01-01: Update Design Tokens and Global CSS (radii and colors).
- [ ] 01-02: Standardize UI Components (Buttons, Inputs, Cards).

### Phase 2: Security Hardening
**Goal**: Secure the JWT implementation for production-ready reliability.
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria**:
  1. Logout is persistent (tokens are blocked in DB).
  2. JWT claims (iss, aud) are validated on every request.
  3. Token refresh flow includes rotation.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Implement DB-backed JWT Blocklist.
- [ ] 02-02: Hardened JWT Validation (Claims and CSRF).
- [ ] 02-03: Secure Refresh Token Rotation.

### Phase 3: Data & Testability
**Goal**: Provide realistic data for testing and development.
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02
**Success Criteria**:
  1. A script exists to populate the database with 50+ realistic records.
  2. Frontend can run with dynamic mock data without a backend (optional but recommended).
**Plans**: 2 plans

Plans:
- [ ] 03-01: Python Mock Data Script (Faker).
- [ ] 03-02: Frontend Mock Data Integration.

### Phase 4: Dashboard & UX Polishing
**Goal**: Final polish on the dashboard to make it professional and intuitive.
**Depends on**: Phase 1, Phase 3
**Requirements**: UI-03, UI-04
**Success Criteria**:
  1. Dashboard Bento Grid is clean and focus-oriented.
  2. Recharts visualizations use a consistent, professional theme.
  3. Navigation is intuitive and doesn't feel "loud".
**Plans**: 2 plans

Plans:
- [ ] 04-01: Dashboard Bento Grid Refactor.
- [ ] 04-02: Professional Chart Theme & UX Polish.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design System | 0/2 | Not started | - |
| 2. Security | 0/3 | Not started | - |
| 3. Data & Testability | 0/2 | Not started | - |
| 4. Dashboard & UX | 0/2 | Not started | - |

---
*Roadmap defined: 2026-05-03*
