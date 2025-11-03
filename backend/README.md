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
