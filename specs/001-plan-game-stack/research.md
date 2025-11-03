# Research Log: Minimal Cross-Platform Game Backend & Frontend

## Tasks

- Research best practices for Express.js REST APIs with JWT auth and Mongoose persistence in a live-ops game context.
- Research best practices for Socket.IO real-time notification channels shared by web and mobile clients.
- Research best practices for MongoDB data modelling to support leaderboards, inventories, violations, and analytics aggregation.
- Research best practices for Nuxt 3 with Pinia and TailwindCSS for a live-ops dashboard and player-facing portal.
- Research integration patterns for delivering notifications and leaderboard updates in near real-time across backend and frontend.
- Research integration patterns for analytics-driven daily challenge generation tied to scheduled jobs.
- Research integration patterns for offline-capable clients synchronizing queued events once connectivity is restored.

## Findings

### Decision: Adopt layered Express.js architecture with modular routers and centralized auth middleware
- **Rationale**: Keeps core services (auth, leaderboards, store, events) independently testable while sharing JWT verification and rate limiting. Aligns with need for guided setup and clear copy-paste code.
- **Alternatives considered**: NestJS (adds learning curve contrary to "idiot-proof" goal); Fastify (faster but fewer examples for new developers).

### Decision: Use Socket.IO namespaces and rooms for targeted notifications and leaderboard pushes
- **Rationale**: Namespaces cleanly separate notification vs. leaderboard channels, and rooms allow addressing groups, friends, or individual users without manual connection tracking. Built-in reconnection handling supports offline scenarios.
- **Alternatives considered**: WebSockets via ws (requires more boilerplate for reconnection and rooms); Server-Sent Events (unidirectional, unsuitable for client event submission).

### Decision: Model MongoDB collections with capped audit collections and compound indexes for performance-critical queries
- **Rationale**: Players, leaderboards, offers, and analytics require predictable lookups; compound indexes on (type, timestamp) or (playerId, metric) keep queries within latency targets. Capped collections for event logs prevent unbounded growth while preserving recent activity for analytics.
- **Alternatives considered**: Relational schema (slower iteration and requires migrations); Redis primary store (fast but complicates persistence guarantees for audits).

### Decision: Structure Nuxt 3 frontend as dual-mode (player entry + operator dashboard) with shared design system
- **Rationale**: Nuxt 3 supports hybrid static/SSR rendering and provides file-based routing for quick setup tutorials. Pinia stores centralize auth/profile state; Tailwind ensures rapid UI scaffolding consistent with copy-and-play guidance.
- **Alternatives considered**: React + Next.js (viable but diverges from requested stack); Vue 2 + Vuex (legacy).

### Decision: Drive notification and leaderboard integrations via shared TypeScript contract package generated from OpenAPI spec
- **Rationale**: Guarantees backend and frontend share payload types, reducing integration bugs and satisfying readiness checklist for contract clarity.
- **Alternatives considered**: Manually maintained interfaces (higher drift risk); GraphQL (overkill for minimal stack and increases learning curve).

### Decision: Implement analytics-driven daily challenge scheduler with node-cron backed by analytics aggregation service
- **Rationale**: Cron jobs trigger at predictable cadence, pulling prior-day metrics and writing challenge offers plus notifications while logging outcomes for audit, matching spec expectation.
- **Alternatives considered**: External scheduler (requires extra infrastructure); Real-time streaming triggers (complex for MVP).

### Decision: Provide offline event queue using IndexedDB/localStorage wrappers with retry + idempotency tokens
- **Rationale**: Allows clients to buffer gameplay events and store purchases until online, satisfying edge case requirements for offline sign-ins and duplicate prevention.
- **Alternatives considered**: No offline support (contradicts edge cases); Service worker-only approach (limits engine integrations outside browsers).
