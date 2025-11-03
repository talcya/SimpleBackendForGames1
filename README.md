[![Contributing](https://img.shields.io/badge/CONTRIBUTING-guidelines-blue.svg)](CONTRIBUTING.md)

# Simple Cross-Platform Games Backend

This repository contains a minimal, cross-platform backend for casual multiplayer games.
It demonstrates an event-driven backend architecture with authentication, leaderboards, in-game items, a rule engine for moderation, and guest-play migration.

This README centralizes key information for developers and maintainers: project structure, quickstart, development workflows, documentation, and troubleshooting tips.

## Project structure

- `backend/` – Express + TypeScript backend, Mongoose models, background jobs, and API routes.
- `specs/001-plan-game-stack/` – design documents, OpenAPI contract and implementation plan for the game stack.

Key backend files and folders:

- `backend/src/` – TypeScript sources for server, routes, services, jobs, and middleware.
- `backend/public/openapi.yaml` – OpenAPI contract (used to produce ReDoc bundle).
- `backend/public/redoc-bundled.html` – generated static docs (produced by `redoc:bundle`).
- `backend/scripts/pnpm-fix-install.ps1` – Windows helper to clean pnpm temp locks and install deps (useful for EPERM issues).
- `backend/README.md` – backend-specific notes (environment, dev flags, docs).
- `backend/README-guest.md` – quick examples for guest-play API usage.

## Requirements

- Node.js 18 LTS or newer
- pnpm (workspace-aware recommended)
- MongoDB (for local dev/tests you can run a local mongod)

## Quickstart (development)

1. Install repository dependencies (from repo root):

```powershell
pnpm install
```

2. Install backend-specific dependencies and dev-only tooling (from repo root):

```powershell
# If you hit EPERM errors on Windows, run the helper (see Troubleshooting)
pnpm -C backend install
```

3. Run backend in dev mode (auto-reload):

```powershell
pnpm -C backend run dev
```

4. Build the backend (TypeScript):

```powershell
pnpm -C backend run build
```

5. Run tests:

```powershell
pnpm -C backend test
```

## Developer documentation (OpenAPI / ReDoc)

- The OpenAPI definition used by the backend lives in `backend/public/openapi.yaml`.
- We produce a static ReDoc HTML bundle with the `redoc:bundle` script. Example:

```powershell
pnpm -C backend run redoc:bundle
# outputs: backend/public/redoc-bundled.html
```

- Note: `@redocly/cli` and a few peer dev packages are included as devDependencies in the backend so the bundle is reproducible in CI.

## Guest-play & migration

The backend supports guest play via short-lived guest sessions. Important points:

- Guest sessions are represented by the `Guest` model and a `guestId` (UUID).
- Events created by guests are stored with a `sessionId` (sparse index) to separate them from authenticated player events.
- When a guest signs up, the `signup` service accepts a `guestId` and attempts to migrate:
  - event logs (sessionId -> playerId)
  - guest inventory -> user.inventory
  - deletion of the guest record
- The migration attempts a MongoDB transaction when available, and falls back to a best-effort non-transactional migration for standalone mongod setups. This ensures local dev and CI work without requiring a replica set.

See `backend/README-guest.md` for example client requests using `X-Guest-Id` and signup payloads.

## Troubleshooting: pnpm EPERM on Windows

Symptom: `pnpm -C backend install` fails with an EPERM / rename error like:

```
EPERM: operation not permitted, rename '...\.modules.yaml.*' -> '...\.modules.yaml'
```

Cause: pnpm performs atomic renames of temporary lockfiles or module metadata. If another process (Editor, Explorer, antivirus) holds the target file, the rename can fail.

Quick remedies:

- Close VS Code, file explorers pointing at the repo, or other tools that might hold file handles.
- Run the install in an elevated PowerShell (Run as Administrator).
- Use the helper script which attempts to stop node/pnpm processes, remove leftover temp files, and install:

```powershell
PowerShell -ExecutionPolicy Bypass -File ./backend/scripts/pnpm-fix-install.ps1
```

You can run the script with `-DryRun` to see which files it would remove, or with `-RunRedoc` to bundle docs after install.

## CI Notes

- Ensure your CI job runs `pnpm -C backend install` before attempting to build/bundle docs. The backend now includes devDependencies for the Redocly CLI and peers to make bundling reproducible.
- If your CI runs in a restricted environment that forbids lockfile updates, use a CI runner with sufficient permissions or run the helper script logic as part of the pipeline.

## Contributing

If you'd like to contribute, please open issues or PRs against `main`. Follow the existing code style and run tests locally before opening PRs:

```powershell
pnpm -C backend test
```

Contributor checklist

Before opening a PR, please run through this short checklist to keep reviews fast and CI green:

- [ ] Fork & create a feature branch with a clear name (e.g. `feat/guest-migrate`).
- [ ] Run the backend tests locally: `pnpm -C backend test` and ensure they pass.
- [ ] Add or update tests that cover the change (happy path + at least one edge case).
- [ ] Run the TypeScript build: `pnpm -C backend run build` and fix any compile errors.
- [ ] Keep changes focused (one concern per PR) and update `backend/public/openapi.yaml` when adding API surface.
- [ ] Add a short description in the PR body with motivation and acceptance criteria.

Thanks — maintainers will review and request changes if needed.

## Contact / Authors

This is an internal sample/prototype. For questions about design decisions (guest migration, rule engine) open an issue in the repo.

---

If you'd like I can also add a top-level `CONTRIBUTING.md`, license, or GitHub Actions CI template to the repository. Which of those would you like next?
