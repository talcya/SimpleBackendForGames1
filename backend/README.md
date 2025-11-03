# Backend (Express + TypeScript)

Quick notes for local development and the event processor.

Environment
- PORT - port to listen on (default: 3001)
- MONGO_URI - MongoDB connection string (default: mongodb://localhost:27017/gameDB)
- JWT_SECRET - JSON Web Token secret
- FRONTEND_URL - frontend origin for CORS (default: http://localhost:3000)
- ENABLE_EVENT_PROCESSOR - set to `true` to start the background EventLog processor (default: false)

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

ESLint / TypeScript advisory

You may see a warning when running ESLint locally that your TypeScript version is newer than the parser supports:

	WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.

This project currently uses TypeScript 5.9.3. If you see that message, you have two safe options:

- Upgrade the `@typescript-eslint` packages to a version that supports your TypeScript (recommended when you control CI/network). For example, bump `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` to a release that lists compatibility with TypeScript 5.9.
- Pin TypeScript to a compatible version (e.g., 5.3.x) in `backend/package.json` so the installed TS matches the parser's supported versions.

CI behaviour

The CI workflow now runs ESLint with `--max-warnings=0` so lint warnings will fail the job. If you prefer to avoid failing CI while you upgrade linters, revert the Lint step in `.github/workflows/ci.yml` to append `|| true`.
