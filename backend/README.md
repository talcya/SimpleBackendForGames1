# Backend (Express + TypeScript)

Quick notes for local development and the event processor.

Environment
- PORT - port to listen on (default: 3001)
- MONGO_URI - MongoDB connection string (default: mongodb://localhost:27017/gameDB)
- JWT_SECRET - JSON Web Token secret
- FRONTEND_URL - frontend origin for CORS (default: http://localhost:3000)
- ENABLE_EVENT_PROCESSOR - set to `true` to start the background EventLog processor (default: false)
 - DEV_MODE - set to `true` in `.env` (or set `NODE_ENV=development`) to opt into development-only features like interactive API docs and dev routes (default: false)

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

Dev API docs and interactive testing
-----------------------------------

During development you can browse the OpenAPI docs and try endpoints interactively.

- ReDoc (readable docs): http://localhost:8000/docs
- Swagger UI (interactive "Try it"): http://localhost:8000/docs/swagger.html

Both endpoints serve the same `openapi.yaml` placed in `backend/public`.

To avoid exposing interactive docs in production, the server will serve them when
either `DEV_MODE=true` (recommended for local development) or when the explicit
`ENABLE_DOCS=true` environment variable is set. This makes it easy to enable
docs during dev via your `.env` while still allowing an explicit override in
other environments.

Minting dev JWTs
-----------------

For convenience there's a dev-only debug route that can mint a JWT for a user:

- GET /v1/debug/token?email=alice@example.com

This route is only mounted when `DEV_MODE=true` (recommended) or when the explicit
`ENABLE_DEV_ROUTES=true` environment variable is set. It must not be enabled in
production. The route returns a signed JWT you can paste into the Swagger UI
token box or store with the "Dev Bearer Token" control in the Swagger page.

Example `.env` (backend/.env):

```
# enable development features locally
DEV_MODE=true

# or alternately set NODE_ENV=development
# NODE_ENV=development
```


Status

- The TypeScript version was pinned to a parser-compatible release in this branch to avoid ESLint parser warnings during CI and local runs. If you'd like to use a newer TypeScript version instead, we can upgrade the `@typescript-eslint` packages and run an install to re-enable that path.

CI behaviour

- The CI workflow runs ESLint with `--max-warnings=0`, so lint warnings will fail the job. This helps catch issues early; if you'd prefer a non-failing lint step temporarily, revert the Lint step in `.github/workflows/ci.yml` to append `|| true`.

CI notes for docs bundling and dev-deps
------------------------------------

- The backend now includes additional devDependencies used to build developer documentation with Redocly's CLI (for example: `@redocly/cli`, `react`, `react-dom`, `ajv`). These are only needed for building the static docs and don't affect production runtime.
- To ensure reproducible builds in CI, the job should run the backend install step to populate these devDependencies before attempting to bundle docs or run doc-related scripts. Example step:

```powershell
pnpm -C backend install
pnpm -C backend run redoc:bundle
```

- If your CI runs in a locked-down environment where updating the workspace lockfile is not allowed, ensure the pipeline executes with permissions to write the lockfile or install node modules into the workspace. For Windows-based runners you can use the helper script at `backend/scripts/pnpm-fix-install.ps1` to attempt safe cleanup and install.
