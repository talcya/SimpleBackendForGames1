Project improvement proposal — SimpleBackendForGames1
===============================================

This document summarizes a recommended, phased improvement plan for the repository and lists practical, reviewable tasks for each phase. It is oriented to reduce developer friction, make CI faster and more reliable, harden concurrent DB operations, and add observability and security improvements.

Summary of findings
-------------------
- Test infra and CI are solid: Jest + ts-jest, per-run test DB isolation, and many integration tests.
- Recent changes improved concurrency semantics (aggregation-pipeline upsert and a per-player guard) and added tests for concurrency/TTL/validation.
- A few areas for improvement: ts-jest deprecation warnings, duplicated test helpers, committed build artifacts (frontend/.nuxt) increasing repo size, CI efficiency, transient duplicate-key noise under high concurrency, logging/observability, and a standardized validation approach.

High-level goals
----------------
1. Improve developer experience (faster feedback, less noise)
2. Make CI faster and more deterministic (split unit/integration, caching)
3. Harden concurrent data operations (retry/backoff, clear semantics)
4. Add structured logging, metrics, and health checks
5. Tighten validation and config hygiene

Phased plan (recommended)
-------------------------

Phase 0 — Quick Wins (0.5–1.5 days)
- Move ts-jest config from `globals` to `transform` in `backend/jest.config.ts` to remove deprecation warnings.
  - Files: `backend/jest.config.ts` (edit)
  - Acceptance: running `pnpm -C backend test` shows no ts-jest deprecation warnings.

- Add `backend/tests/helpers.ts` with helpers: createServerOnce(), signupAndGetToken(), createGuestWithItem(), pollForActivity(). Refactor 3 representative tests to use helpers.
  - Files: `backend/tests/helpers.ts`, modify `backend/tests/integration/*spec.ts` as examples
  - Acceptance: tests pass and duplicate code is reduced.

- Add `.gitignore` entries to exclude `frontend/.nuxt/*` and other build artifacts accidentally committed; optionally remove them from repo history in a separate PR if desired.
  - Files: `.gitignore`
  - Acceptance: repo size decreases on subsequent commits; CI checkouts faster.

Phase 1 — Tests & CI (1–2 days)
- Split tests in CI: run unit tests on PRs and integration tests on main/merge or nightly.
  - Files: `.github/workflows/ci.yml` (edit), optionally new workflow files
  - Acceptance: PRs run fast unit jobs; integration tests run in a separate job.

- Add Jest caching and pnpm cache in GitHub Actions; use `--runInBand` only when needed (integration job) and parallelize unit runs.
  - Acceptance: measurable CI time reduction (~30% typical).

- Add a `TEST_WAIT_FOR_MIGRATION_EVENT` env toggle to make guest migration tests strictly require the event when desired; default remains backwards compatible.
  - Files: `backend/tests/*`, `backend/src/services/auth.service.ts` (small conditional)

Phase 2 — Reliability & Architecture (2–6 days)
- Make score upsert resilient to the transient duplicate-key plan-executor errors.
  - Options: retry with jitter around the atomic findOneAndUpdate, or catch duplicate-key and re-run a safe reconciliation call. Add tests simulating heavy concurrency.
  - Files: `backend/src/helpers/gameProcessing.ts` (edit), tests: `backend/tests/integration/player-scores-concurrency.spec.ts` (extend)
  - Acceptance: under synthetic concurrency the API returns stable 200s (or defined semantics) and no 500s.

- Document and parameterize the PlayerActivity guard (environment variable `PLAYER_ACTIVITY_DEDUPE_MS` exists already) and optionally expose guard collection name and metrics.
  - Files: `backend/src/config/index.ts` (already has `PLAYER_ACTIVITY_DEDUPE_MS`), add metrics code.

- Index review: validate and add indexes for frequent queries (EventLog.sessionId, EventLog.playerId, PlayerScore player/game composite index, PlayerActivity guard uniqueness).

Phase 3 — Observability & Security (4–10 days)
- Add structured logging (pino) and propagate correlation IDs through request headers and long-running background processing.
  - Files: `backend/src/middleware/*` (add correlation id middleware), `backend/src/app.ts` (wire logger)

- Add Prometheus metrics (prom-client) for request latencies, upsert retries, guard acquisitions, DB error counters, TTL expirations.

- Security: add rate-limiting rules (already present dependency) tuned for endpoints, add request size limits, and CI secrets scanning.

Phase 4 — Developer Experience & Releases (ongoing)
- Husky pre-commit hooks, lint-staged, commit message linting (conventional commits), and optional semantic-release automation.

File-by-file change suggestions (example PRs)
------------------------------------------
1. PR: `jest-config-fixes`
   - Edit: `backend/jest.config.ts` move ts-jest config into `transform`.
   - Test: CI runs and no ts-jest warnings.

2. PR: `tests-helpers-refactor`
   - Add: `backend/tests/helpers.ts`
   - Edit: refactor `guest-flows.spec.ts`, `player-scores-concurrency.spec.ts`, `player-scores-malformed.spec.ts` to use helpers.

3. PR: `ci-split-tests`
   - Edit: `.github/workflows/ci.yml` split unit/integration and add caching.

4. PR: `upsert-resilience`
   - Edit: `backend/src/helpers/gameProcessing.ts` add retry/backoff for duplicate-key errors and add new integration tests.

5. PR: `observability`
   - Add: `backend/src/lib/logger.ts`, `backend/src/middleware/correlationId.ts` and integrate pino/prom-client.

Estimates & priority
--------------------
- Immediate (high priority): Phase 0 tasks (ts-jest fix, tests/helpers, .gitignore) — reduces noise and speeds dev iteration.
- Short term (medium): Phase 1 CI improvements — reduces PR cycle times.
- Midterm (high impact): Phase 2 concurrency resilience and index improvements — reduces production incidents and test flakiness.
- Long term: Phase 3 observability & security — improves run-time diagnostics and compliance.

Acceptance criteria
-------------------
- Phase 0: All local tests run with no ts-jest deprecation warnings; test helper reduces duplication; `.gitignore` avoids new build artifacts committed.
- Phase 1: PRs run unit tests only (fast); integration tests run on main; CI runtime reduced by caching.
- Phase 2: Concurrency tests pass consistently under synthetic load; no server 500s on expected concurrent workloads.
- Phase 3: Structured logs and metrics available locally and in CI; no secret files committed.

Risks & mitigations
-------------------
- Removing committed frontend build files: confirm with team before history rewrite. Mitigation: add `.gitignore` and stop committing; optional history re-write if approved.
- DB behavior changes: add tests and run against staging Mongo to confirm semantics.
- New dependencies: keep optional and minimal; add to dev/prod appropriately.

Next steps I can take now (pick one)
-----------------------------------
1) Implement Phase 0 quick wins now (ts-jest fix, tests/helpers, .gitignore). (Estimated: 1 day)
2) Prepare the CI split (Phase 1) and open PR. (Estimated: 1 day)
3) Draft PR for `upsert-resilience` with a proposed retry strategy and tests (Phase 2). (Estimated: 1–2 days)

Please respond with which next step you approve (1, 2 or 3) and any constraints (CI preferences, whether it's OK to remove build artifacts). Once approved I'll create small PR(s) implementing the changes and run the full test suite locally + in CI.

Appendix: quick scan notes
--------------------------
- `backend/jest.config.ts` currently defines `globals.ts-jest` (deprecated) — move it to `transform`.
- `.github/workflows/ci.yml` runs a monolithic build-and-test; splitting unit vs integration will speed feedback on PRs.
- `backend/package.json` contains devDeps for `ts-jest`, `pino` not present — recommended addition for Phase 3.
