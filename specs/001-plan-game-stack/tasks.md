# Tasks: Minimal Cross-Platform Game Backend & Frontend

**Input**: Design documents from `/specs/001-plan-game-stack/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are included only where they directly support story acceptance criteria.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish workspace layout and baseline tooling for backend, frontend, and shared contracts.

- [ ] T001 Configure workspace package management in `package.json` to register `backend`, `frontend`, and `shared/contracts` packages.
- [ ] T002 Define pnpm workspaces in `pnpm-workspace.yaml` at repository root.
- [ ] T003 [P] Scaffold backend project metadata and scripts in `backend/package.json` including dev, build, and test commands.
- [ ] T004 [P] Initialize Nuxt 3 project metadata and scripts in `frontend/package.json` with lint and test targets.
- [ ] T005 [P] Create shared contracts package manifest and build scripts in `shared/contracts/package.json` for OpenAPI code generation.
- [X] T001 Configure workspace package management in `package.json` to register `backend`, `frontend`, and `shared/contracts` packages.
- [X] T002 Define pnpm workspaces in `pnpm-workspace.yaml` at repository root.
- [X] T003 [P] Scaffold backend project metadata and scripts in `backend/package.json` including dev, build, and test commands.
- [X] T004 [P] Initialize Nuxt 3 project metadata and scripts in `frontend/package.json` with lint and test targets.
- [X] T005 [P] Create shared contracts package manifest and build scripts in `shared/contracts/package.json` for OpenAPI code generation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [ ] T006 Implement environment and Mongo connection configuration in `backend/src/config/index.ts` with typed helpers.
- [ ] T007 Create Express + Socket.IO bootstrap in `backend/src/server.ts` wiring Helmet, CORS, rate limiting, and shared error handler.
- [ ] T008 [P] Add JWT authentication middleware with token refresh handling in `backend/src/middleware/auth.ts`.
- [ ] T009 [P] Establish unified error and logging middleware in `backend/src/middleware/error-handler.ts` with winston integration.
- [ ] T010 [P] Configure OpenAPI type generation pipeline in `shared/contracts/openapi-codegen.config.ts` consuming `specs/001-plan-game-stack/contracts/openapi.yaml`.
- [ ] T011 [P] Set up Jest and Supertest harness in `backend/jest.config.ts` and seed `backend/tests/setup/global.ts`.
- [ ] T012 Prepare Nuxt 3 base layout, Tailwind integration, and global providers in `frontend/app/app.vue` and `frontend/tailwind.config.ts`.
- [ ] T013 [P] Configure ESLint root settings covering backend and frontend in `.eslintrc.cjs` with shared rulesets.
- [ ] T014 [P] Define strict TypeScript compiler options in `backend/tsconfig.json`, `frontend/tsconfig.json`, and `shared/contracts/tsconfig.json` with `noEmitOnError` enabled.
- [ ] T015 [P] Wire project-wide build validation scripts in root `package.json` to run `pnpm build` for backend and frontend before deploys.
- [ ] T016 Establish static analysis pipeline by adding `sonar-project.properties` and wiring ESLint bug-detection plugins.
- [X] T006 Implement environment and Mongo connection configuration in `backend/src/config/index.ts` with typed helpers.
- [X] T007 Create Express + Socket.IO bootstrap in `backend/src/server.ts` wiring Helmet, CORS, rate limiting, and shared error handler.
- [X] T008 [P] Add JWT authentication middleware with token refresh handling in `backend/src/middleware/auth.ts`.
- [X] T009 [P] Establish unified error and logging middleware in `backend/src/middleware/error-handler.ts` with winston integration.
- [X] T010 [P] Configure OpenAPI type generation pipeline in `shared/contracts/openapi-codegen.config.ts` consuming `specs/001-plan-game-stack/contracts/openapi.yaml`.
- [X] T011 [P] Set up Jest and Supertest harness in `backend/jest.config.ts` and seed `backend/tests/setup/global.ts`.
- [X] T012 Prepare Nuxt 3 base layout, Tailwind integration, and global providers in `frontend/app/app.vue` and `frontend/tailwind.config.ts`.
- [X] T013 [P] Configure ESLint root settings covering backend and frontend in `.eslintrc.cjs` with shared rulesets.
- [X] T014 [P] Define strict TypeScript compiler options in `backend/tsconfig.json`, `frontend/tsconfig.json`, and `shared/contracts/tsconfig.json` with `noEmitOnError` enabled.
- [X] T015 [P] Wire project-wide build validation scripts in root `package.json` to run `pnpm build` for backend and frontend before deploys.
- [X] T016 Establish static analysis pipeline by adding `sonar-project.properties` and wiring ESLint bug-detection plugins.

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Unified Player Progress (Priority: P1) 🎯 MVP

**Goal**: Deliver cross-platform authentication, profile recovery, and synchronized high score propagation.

**Independent Test**: Create a player, sign in from two device profiles, submit a higher score, and confirm profile and leaderboards update within defined freshness.

### Implementation for User Story 1

- [ ] T017 [P] [US1] Define player schema with credentials, social links, and profile fields in `backend/src/models/user.ts`.
- [ ] T018 [P] [US1] Define leaderboard schema and indexes in `backend/src/models/leaderboard.ts`.
 - [X] T017 [P] [US1] Define player schema with credentials, social links, and profile fields in `backend/src/models/user.ts`.
 - [X] T018 [P] [US1] Define leaderboard schema and indexes in `backend/src/models/leaderboard.ts`.
 - [X] T019 [US1] Implement authentication service covering signup, login, and token issuance in `backend/src/services/auth.service.ts`.
 - [X] T020 [US1] Create authentication routes (signup, login, Google OAuth callbacks) in `backend/src/routes/auth.routes.ts`.
 - [X] T021 [US1] Build player profile and high score routes in `backend/src/routes/players.routes.ts` with leaderboard updates.
 - [X] T022 [P] [US1] Configure Google strategy and session serialization in `backend/src/config/passport.ts`.
 - [X] T023 [US1] Emit leaderboard updates over Socket.IO in `backend/src/sockets/leaderboard.channel.ts` when scores change.
 - [X] T024 [US1] Add integration coverage for signup, login, and score submission in `backend/tests/integration/player-progress.spec.ts`.
- [ ] T025 [P] [US1] Create Pinia user store handling auth state and high score sync in `frontend/stores/user.ts`.
- [ ] T026 [US1] Implement login page with Google fallback in `frontend/pages/login.vue` consuming shared contracts.
- [ ] T027 [US1] Implement dashboard page showing profile, inventory, and leaderboards in `frontend/pages/dashboard.vue`.
- [ ] T028 [P] [US1] Provide offline event queue composable for score submissions in `frontend/composables/useOfflineQueue.ts`.
- [ ] T029 [US1] Author end-to-end flow test for cross-device progress sync in `frontend/tests/e2e/user-progress.spec.ts`.

**Checkpoint**: Player identity, high scores, and UI flows operate independently.

---

## Phase 4: User Story 2 - Fair Play Enforcement (Priority: P2)

**Goal**: Ingest gameplay events, evaluate rule thresholds, and surface violations for moderation.

**Independent Test**: Submit compliant and violating events, confirm violations are recorded and displayed for review.

### Implementation for User Story 2

- [ ] T030 [P] [US2] Define rule schema with action thresholds in `backend/src/models/rule.ts`.
- [ ] T031 [P] [US2] Define violation schema with cumulative counts in `backend/src/models/violation.ts`.
- [ ] T032 [US2] Create event log schema capturing payloads and evaluation results in `backend/src/models/event-log.ts`.
- [ ] T033 [US2] Implement rule evaluation service applying thresholds in `backend/src/services/rule-engine.service.ts`.
- [ ] T034 [US2] Implement violation tracking service with escalation logic in `backend/src/services/violations.service.ts`.
- [ ] T035 [US2] Build events ingestion route with rule enforcement in `backend/src/routes/events.routes.ts`.
- [ ] T036 [US2] Add integration tests covering rule breaches in `backend/tests/integration/violations.spec.ts`.
- [ ] T037 [P] [US2] Create moderation violations view in `frontend/pages/ops/violations.vue` with filters.
- [ ] T038 [US2] Surface event timeline component for moderators in `frontend/components/EventTimeline.vue`.
- [ ] T039 [US2] Add end-to-end moderation review test in `frontend/tests/e2e/moderation.spec.ts`.

**Checkpoint**: Rule enforcement and moderator workflows function independently.

---

## Phase 5: User Story 3 - Live Ops Engagement (Priority: P3)

**Goal**: Enable operators to manage store items, offers, groups, and targeted notifications with real-time delivery.

**Independent Test**: Create store content, target an offer to a group, send notifications, and verify eligible players receive them promptly.

### Implementation for User Story 3

- [ ] T040 [P] [US3] Define store item schema with acquisition metadata in `backend/src/models/store-item.ts`.
- [ ] T041 [P] [US3] Define player group schema in `backend/src/models/group.ts`.
- [ ] T042 [P] [US3] Define offer schema including scheduling in `backend/src/models/offer.ts`.
- [ ] T043 [P] [US3] Define notification schema with delivery tracking in `backend/src/models/notification.ts`.
- [ ] T044 [US3] Implement store catalog service in `backend/src/services/store.service.ts`.
- [ ] T045 [US3] Expose store routes for listing and purchases in `backend/src/routes/store.routes.ts`.
- [ ] T046 [US3] Implement group management service in `backend/src/services/groups.service.ts`.
- [ ] T047 [US3] Implement offer scheduling service in `backend/src/services/offers.service.ts`.
- [ ] T048 [US3] Implement notification dispatch service in `backend/src/services/notifications.service.ts`.
- [ ] T049 [US3] Create notification routes for send and inbox operations in `backend/src/routes/notifications.routes.ts`.
- [ ] T050 [P] [US3] Wire Socket.IO notification channel in `backend/src/sockets/notifications.channel.ts`.
- [ ] T051 [US3] Add integration test for targeted notifications and redemption in `backend/tests/integration/notifications.spec.ts`.
- [ ] T052 [P] [US3] Build store management dashboard in `frontend/pages/ops/store.vue`.
- [ ] T053 [P] [US3] Build offer scheduling dashboard in `frontend/pages/ops/offers.vue`.
- [ ] T054 [P] [US3] Implement player notifications inbox in `frontend/pages/notifications.vue`.
- [ ] T055 [US3] Create real-time notification toast component in `frontend/components/NotificationToast.vue`.
- [ ] T056 [US3] Add Pinia notifications store handling sockets in `frontend/stores/notifications.ts`.
- [ ] T057 [US3] Add end-to-end notification delivery test in `frontend/tests/e2e/notifications.spec.ts`.

**Checkpoint**: Live ops tooling delivers targeted content independently of other stories.

---

## Phase 6: User Story 4 - Insight-Driven Challenges (Priority: P4)

**Goal**: Aggregate analytics, generate daily challenges, and surface insights to analysts.

**Independent Test**: Produce analytics from captured events, auto-generate next-day challenge, and confirm analysts can review metrics.

### Implementation for User Story 4

- [ ] T058 [P] [US4] Define analytics metric schema in `backend/src/models/analytics.ts`.
- [ ] T059 [P] [US4] Define daily challenge schema in `backend/src/models/daily-challenge.ts`.
- [ ] T060 [US4] Implement analytics aggregation service in `backend/src/services/analytics.service.ts`.
- [ ] T061 [US4] Implement daily challenge generation job in `backend/src/jobs/daily-challenge.job.ts`.
- [ ] T062 [US4] Expose analytics query routes in `backend/src/routes/analytics.routes.ts`.
- [ ] T063 [US4] Expose daily challenge routes in `backend/src/routes/challenges.routes.ts`.
- [ ] T064 [US4] Add integration test verifying challenge generation cadence in `backend/tests/integration/daily-challenge.spec.ts`.
- [ ] T065 [P] [US4] Build analytics dashboard page in `frontend/pages/ops/analytics.vue` using chart components.
- [ ] T066 [P] [US4] Implement reusable analytics chart wrapper in `frontend/components/AnalyticsChart.vue`.
- [ ] T067 [US4] Add daily challenge widget integration in `frontend/components/DailyChallengeCard.vue` and inject into `frontend/pages/dashboard.vue`.
- [ ] T068 [US4] Add end-to-end challenge announcement test in `frontend/tests/e2e/daily-challenge.spec.ts`.

**Checkpoint**: Analytics-driven challenges operate independently and complement prior stories.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Repository-wide hardening, documentation, and validation.

- [ ] T069 [P] Update environment sample files in `backend/.env.example` and `frontend/.env.example` with final configuration guidance.
- [ ] T070 [P] Refresh developer onboarding steps in `specs/001-plan-game-stack/quickstart.md` after implementation.
- [ ] T071 Document operational playbook for live ops and analytics workflows in `docs/operations/playbook.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No prerequisites — establishes workspace scaffolding.
- **Phase 2 (Foundational)**: Requires Phase 1 completion; blocks all user stories until shared infrastructure is ready.
- **Phase 3 (US1)**: Depends on Phase 2; once complete, delivers MVP and unlocks later stories.
- **Phase 4 (US2)**: Depends on Phase 2; can run in parallel with Phase 3 after foundation is ready.
- **Phase 5 (US3)**: Depends on Phase 2 and benefits from US1 data models; otherwise independent once foundation exists.
- **Phase 6 (US4)**: Depends on Phase 2 and event ingestion from US2; can start after US2 establishes event logging.
- **Phase 7 (Polish)**: Begins after targeted stories reach desired completeness.

### User Story Dependencies

1. **US1 → US2**: Rule enforcement relies on authenticated event submissions established in US1.
2. **US2 → US4**: Analytics and challenges require event and violation data captured in US2.
3. **US1 & US2 → US3**: Live ops tools use player profiles and groups seeded in US1 and may reference rule outcomes from US2, but can proceed once foundational models exist.
4. **US3 → US4 (optional)**: Challenge rewards may reference offers; coordinate redemption data after US3 if required.

### Within Each User Story

- Complete schema tasks before service logic.
- Complete services before exposing routes and sockets.
- Implement automated tests after core behavior but before UI polishing.
- Ensure Playwright flows run cleanly before declaring the story complete.

### Parallel Opportunities

- Setup tasks T003–T005 can run concurrently after T001–T002.
- Foundational tasks T008–T016 are parallel-friendly once `backend/src/server.ts` is scaffolded.
- US1 model tasks T017–T018 and frontend tasks T025–T028 can run in parallel.
- US2 schemas T030–T032 and UI tasks T037–T038 can progress concurrently.
- US3 models T040–T043 and UI pages T052–T054 are parallelizable.
- US4 schemas T058–T059 and dashboard tasks T065–T066 can proceed simultaneously.

---

## Parallel Execution Examples

### User Story 1

```bash
# Backend models and frontend offline queue can proceed in parallel once foundation is ready
Task: T017 [US1] backend/src/models/user.ts
Task: T018 [US1] backend/src/models/leaderboard.ts
Task: T028 [US1] frontend/composables/useOfflineQueue.ts
```

### User Story 2

```bash
# Build schemas while UI team assembles moderation view
Task: T030 [US2] backend/src/models/rule.ts
Task: T031 [US2] backend/src/models/violation.ts
Task: T037 [US2] frontend/pages/ops/violations.vue
```

### User Story 3

```bash
# Operators dashboard work can proceed alongside backend offer services
Task: T042 [US3] backend/src/models/offer.ts
Task: T047 [US3] backend/src/services/offers.service.ts
Task: T053 [US3] frontend/pages/ops/offers.vue
```

### User Story 4

```bash
# Analytics models and dashboards are independent tasks once events flow
Task: T058 [US4] backend/src/models/analytics.ts
Task: T059 [US4] backend/src/models/daily-challenge.ts
Task: T065 [US4] frontend/pages/ops/analytics.vue
```

---

## Implementation Strategy

### MVP First (Deliver User Story 1)

1. Complete Setup (Phase 1) and Foundational (Phase 2) tasks.
2. Implement all US1 tasks (Phase 3) and run `backend/tests/integration/player-progress.spec.ts` and `frontend/tests/e2e/user-progress.spec.ts`.
3. Demo unified player progress; defer later stories if timelines compress.

### Incremental Delivery

1. After MVP, deliver US2 for fairness and moderation.
2. Layer in US3 for monetization and engagement tooling.
3. Finish with US4 for analytics-driven challenges.
4. After each story, run its end-to-end tests before merging.

### Parallel Team Strategy

- **Team A**: Focus on backend services and routes per story.
- **Team B**: Build frontend experiences and Pinia stores per story.
- **Team C**: Maintain shared contracts and automated tests.
- Sync daily to align contract updates with both backend and frontend consumers.

---

## Notes

- [P] tasks involve separate files and can be assigned concurrently.
- Story labels ([US1]–[US4]) enable traceability back to specification priorities.
- Verify automated tests fail before implementing behavior, then ensure they pass post-implementation.
- Commit after each task or logical grouping to preserve incremental history.
- Mandatory quality gates: run ESLint, `tsc --noEmit`, project build scripts, Jest suites, and SonarQube analysis locally and via CI on every PR.
