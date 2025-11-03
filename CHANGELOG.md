# Changelog

## Unreleased

- Merge: feat(processor): graceful shutdown + processor tests (PR #1) — merged 2025-11-03
  - Added graceful shutdown in `server.ts` to handle SIGINT/SIGTERM
  - Wired event processor start/stop into `createServer()` and made poll interval configurable via `PROCESSOR_POLL_MS`
  - Added unit tests for the event processor and rule engine, and an integration test that validates processing before shutdown
  - Pin TypeScript to 5.3.3 in branch to avoid ESLint parser warnings; follow-up PR will upgrade ESLint packages so modern TS can be used

## 2025-11-03
- Initial project scaffold and features (see commit history)
