# Backend (Express + TypeScript)

Quick notes for local development and the event processor.

Environment
- PORT - port to listen on (default: 3001)
- MONGO_URI - MongoDB connection string (default: mongodb://localhost:27017/gameDB)
- JWT_SECRET - JSON Web Token secret
- FRONTEND_URL - frontend origin for CORS (default: http://localhost:3000)
- ENABLE_EVENT_PROCESSOR - set to `true` to start the background EventLog processor (default: false)

API Documentation
- Redoc is available during development. The OpenAPI contract lives in `specs/001-plan-game-stack/contracts/openapi.yaml` and a copy is served from the running backend at `/docs/openapi.yaml`.
- Visit `http://localhost:8000/docs` (or the value of `PORT`) to view interactive API docs powered by Redoc.

Run locally (dev):

- Install deps: `npm install`
- Start in dev (auto-reload): `npm run dev`

Run built artifacts:

- Build: `npm run build`
- Start: `npm start` (runs `node dist/server.js`)

Enable background event processor

Set `ENABLE_EVENT_PROCESSOR=true` in your environment to enable the interval-based event processor which polls for pending EventLogs and evaluates them against active rules.

Graceful shutdown

The server listens for SIGINT and SIGTERM. On shutdown it will:
- stop accepting new connections
- stop the event processor (if enabled)
- disconnect from MongoDB

This ensures tests and local runs exit cleanly.

Notes
- For tests, the test harness already ensures MongoDB disconnects and the server closes to avoid Jest hanging on open handles.

Status

- The TypeScript version was pinned to a parser-compatible release in this branch to avoid ESLint parser warnings during CI and local runs. If you'd like to use a newer TypeScript version instead, we can upgrade the `@typescript-eslint` packages and run an install to re-enable that path.

CI behaviour

- The CI workflow runs ESLint with `--max-warnings=0`, so lint warnings will fail the job. This helps catch issues early; if you'd prefer a non-failing lint step temporarily, revert the Lint step in `.github/workflows/ci.yml` to append `|| true`.
