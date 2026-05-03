# Project: Barber Shop Improvement (Layout & Security)

## What This Is
A comprehensive improvement phase for the Barber Shop management application, focusing on transitioning from a "loud" and non-intuitive UI to a professional, high-end experience, while hardening the security layer and improving the developer experience with mock data.

## Core Value
Professionalism and trust. A business management tool must feel reliable, clean, and secure.

## Context
The current application uses a Flask backend and React/TypeScript frontend. While functional, the UI is perceived as "unprofessional" and "non-intuitive" due to excessive rounded shapes and "scandalous" colors/animations. The security layer (JWT) relies on in-memory storage for blocklists, which is not production-ready.

---

## Requirements

### Active
- [ ] **Professional Layout Refactor**: 
    - Reduce extreme border-radii (from 2.5rem to more professional values).
    - Simplify the color palette to more muted, elegant tones (less "loud").
    - Improve dashboard clarity: less "glow", more focus on data.
- [ ] **Security Hardening (JWT)**:
    - Implement persistent JWT blocklist (DB-backed or Redis-ready).
    - Validate `iss` (issuer) and `aud` (audience) claims.
    - Ensure CSRF protection for JWT-based auth.
- [ ] **Mock Data Generation**:
    - Create a script/service to populate the database with realistic test data (Clients, Barbers, Appointments, Finance).
- [ ] **UX Intuition**:
    - Refactor navigation and interactive elements to be more intuitive and less "format-heavy".

### Validated
- ✓ Flask/PostgreSQL/SQLAlchemy Backend Structure.
- ✓ React/TypeScript/Vite Frontend Structure.
- ✓ Basic JWT Authentication flow (Login/Protected Routes).

### Out of Scope
- Full redesign of the business logic.
- Mobile native application (focus remains on Web).

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Reduce radii | User feedback indicated 2.5rem is "too rounded" and non-intuitive. | — Pending |
| DB-backed Blocklist | In-memory blocklist clears on restart, allowing revoked tokens to be reused. | — Pending |
| Muted Palette | Current "scandalous" dashboard is perceived as unprofessional. | — Pending |

---

## Evolution
This document evolves at phase transitions.

---
*Last updated: 2026-05-03 after initialization*
