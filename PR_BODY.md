Title: feat(processor): graceful shutdown + processor tests

Summary:
- Add graceful shutdown logic to the backend (`server.ts`) so SIGINT/SIGTERM close the server, stop background processors, and disconnect MongoDB.
- Wire the event processor start/stop in `createServer()` and make its poll interval configurable via `PROCESSOR_POLL_MS`.
- Add unit tests for the event processor and rule engine, and an improved integration test that verifies the processor processes an inserted EventLog before shutdown.
- Pin TypeScript to 5.3.3 to avoid ESLint parser warnings in CI; CI now fails on ESLint warnings (`--max-warnings=0`).

Tests:
- Ran full backend test suite locally: all tests pass.

Notes:
- If you'd like to keep TypeScript 5.9+, we can instead upgrade `@typescript-eslint/*` packages; I can prepare that change upon request.
