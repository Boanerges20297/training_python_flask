# Requirements: Barber Shop Improvement

**Defined:** 2026-05-03
**Core Value:** Professionalism and trust. A business management tool must feel reliable, clean, and secure.

## v1 Requirements

### Layout & UI (Professionalism)
- [ ] **UI-01**: Standardize border-radii across the app (max 0.75rem for cards, 0.5rem for buttons).
- [ ] **UI-02**: Simplify global color palette (muted primary colors, clean backgrounds).
- [ ] **UI-03**: Refactor Dashboard Bento Grid to be less "loud" (remove excessive glows/animations).
- [ ] **UI-04**: Improve chart legibility (professional Recharts themes).

### Security (Hardening)
- [ ] **SEC-01**: Implement DB-backed JWT Blocklist for persistent logout.
- [ ] **SEC-02**: Implement JWT Claim Validation (Issuer/Audience/Expiration).
- [ ] **SEC-03**: Secure Token Refresh flow with rotation and reuse detection.
- [ ] **SEC-04**: Audit and fix CSRF vulnerabilities in the auth flow.

### Data & Testability
- [ ] **DATA-01**: Create a Python script to populate the DB with realistic mock data.
- [ ] **DATA-02**: Implement dynamic mock data generation for frontend testing (Mocks/Faker).

## v2 Requirements
- **UX-01**: Dark/Light mode toggle (if not already fully functional).
- **PERF-01**: Advanced caching for dashboard metrics.

## Out of Scope
| Feature | Reason |
|---------|--------|
| New business features | Focus is on improving existing features/security. |
| Multi-tenancy | Not requested in this phase. |

## Traceability
| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 1 | Pending |
| UI-04 | Phase 1 | Pending |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 2 | Pending |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-03*
*Last updated: 2026-05-03 after initial definition*
