# Summary: Phase 2 — Security Hardening

## Work Completed
Enhanced the security of the JWT authentication system by implementing persistent revocation and rotation.

### Infrastructure (Plan 02-01)
- **Model**: Created `TokenBlocklist` in `backend/app/models/token_blocklist.py` to store revoked tokens.
- **Config**: Updated `JWT_ACCESS_TOKEN_EXPIRES` to **60 minutes** and set `JWT_REFRESH_TOKEN_EXPIRES` to 30 days.

### Logic & Rotation (Plan 02-02)
- **AuthService**: 
    - Replaced `MOCK_BLOCKLIST` with database queries to `TokenBlocklist`.
    - Implemented **Refresh Token Rotation**: calling `/refresh` now revokes the old refresh token and issues a new pair.
- **Callbacks**: Updated `jwt_callbacks.py` to use the new service-based verification.
- **Routes**: Updated `/api/auth/refresh` and `/api/auth/logout` to support the new security flow.

## Verification Results
- [x] Logouts are now persistent in the `token_blocklist` table.
- [x] Refresh tokens are single-use (Rotation verified).
- [x] Access tokens now last 60 minutes as requested.

## Next Steps
Proceed to Phase 3: Data & Testability (Mock data generation).

---
*Completed: 2026-05-03*
