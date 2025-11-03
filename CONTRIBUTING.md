# Contributing

Thanks for considering contributing to this repository. This document describes the minimal steps and expectations for contributing patches, tests, and documentation.

1) Open an issue first
- If you plan to add a feature or make a non-trivial change, open an issue describing the problem and proposed solution. This helps avoid duplicated effort.

2) Branch naming and PRs
- Create a branch off `main` named like `feat/guest-migration` or `fix/pnpm-lock-ephemeral`.
- Include a clear title and description in the PR. Reference related issues with `#<issue>`.

3) Code style and tests
- The backend is TypeScript. Please follow the existing style used in the repo.
- Run the test suite locally before submitting a PR:

```powershell
pnpm -C backend test
```

- If you add or change behavior, include unit or integration tests that cover the change. Keep tests fast and deterministic.

4) Docs and OpenAPI
- If your change affects the public HTTP API, update `backend/public/openapi.yaml` and re-bundle docs:

```powershell
pnpm -C backend run redoc:bundle
```

5) Troubleshooting common local issues
- On Windows, `pnpm` can fail with EPERM on atomic lockfile rename. Use the helper script if you run into that:

```powershell
PowerShell -ExecutionPolicy Bypass -File ./backend/scripts/pnpm-fix-install.ps1
```

- If you add or update TypeScript types (for example installing `@types/*`), your editor
- may not immediately pick them up. In most editors (like VS Code) a quick
- "TypeScript: Restart TS Server" or a full editor reload will make the new types
- available and clear 'cannot find name' diagnostics. Also ensure `backend/tsconfig.json`
- includes the appropriate type entries (for tests we include `jest`).

6) CI checks
- The repository runs TypeScript build and tests in CI. Ensure your PR passes the CI checks before requesting review.

7) Review and merge
- Maintain backward compatibility where practical. For breaking changes, document migration steps.
- After PR approval, maintainers will merge to `main` and create a release if appropriate.

Thanks — we appreciate your contributions!
