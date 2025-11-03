# PR: Implement Auth (JWT + Refresh) and Passport Google wiring

Summary

This patch finalizes the backend authentication implementation for US1 and tightens related typings and linting.

What changed

- Implemented JWT access + refresh token flows with rotation and jwtVersion revocation.
  - `backend/src/services/auth.service.ts` - signup, login, issue tokens, verify refresh
- Added/updated auth routes including refresh and logout endpoints.
  - `backend/src/routes/auth.routes.ts`
- Implemented typed `requireAuth` and `optionalAuth` middleware.
  - `backend/src/middleware/auth.ts`
- Implemented Google OAuth wiring with Passport (request-aware verify) and safe typing for profile.
  - `backend/src/config/passport.ts`
- Updated user & leaderboard models and player score route to emit Socket.IO events.
  - `backend/src/models/user.ts`, `backend/src/models/leaderboard.ts`, `backend/src/routes/players.routes.ts`
- Tightened types: added JwtPayload types, Request augmentation, removed ambient passport declarations.
- Added ESLint improvements and bumped TypeScript in backend to match environment.
- Tests: integration tests for refresh rotation, logout revocation, and player progress updated and passing.

Why

- Provides a robust, test-covered authentication foundation for user flows in US1.
- Uses refresh token rotation + jwtVersion strategy to safely revoke tokens.
- Keeps Google OAuth typed and safe while preserving runtime behavior.

How to review

- Focus on `backend/src/services/auth.service.ts` for token design.
- Confirm `backend/src/config/passport.ts` uses the request-aware strategy and the verify function.
- Run tests locally: `pnpm -C backend exec jest --config jest.config.ts --runInBand`.

Follow-ups

- Optionally replace local minimal profile type with full upstream profile type (done in this PR) and tighten ESLint rules to error on `any`.
- Expand integration tests for multi-session refresh rotation.
