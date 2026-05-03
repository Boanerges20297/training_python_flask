# Phase 2 Context: Security Hardening (JWT)

## Decisions
1. **Blocklist Storage**: Use **SQLAlchemy (Database)** to persist revoked tokens.
2. **Refresh Token Rotation**: **Enabled**. Each refresh token can only be used once; re-use triggers session invalidation.
3. **Claim Validation**: **Strict** validation of `iss` (issuer) and `aud` (audience).
4. **Token Expiry**:
   - Access Token: **60 minutes**.
   - Refresh Token: Keep default or set to 30 days.

## Technical Strategy
- **Model**: Create `TokenBlocklist` model with `id`, `jti` (unique), `type`, `user_id`, and `created_at`.
- **AuthService**: 
    - Update `revoke_token` to save to DB.
    - Update `is_token_revoked` to check DB.
    - Implement rotation logic in `renew_access_token` (create new refresh token and revoke old one).
- **Configuration**: Update `config.py` (or where JWT is configured) to set `JWT_ACCESS_TOKEN_EXPIRES`, `JWT_DECODE_ISSUER`, and `JWT_DECODE_AUDIENCE`.
- **Callbacks**: Ensure `jwt_callbacks.py` is correctly checking the DB blocklist.

## Impact
- Logout becomes persistent (survives server restarts).
- Enhanced security against token theft (via rotation).
- Strict validation prevents cross-app token usage.
