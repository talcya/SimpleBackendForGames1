import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
  jwtSecret: process.env.JWT_SECRET || 'change-me-please',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
// If DEV_MODE is set to 'true' in .env or NODE_ENV === 'development', treat as dev mode.
export const dev = (process.env.DEV_MODE === 'true') || process.env.NODE_ENV === 'development';

// Feature flags. If not explicitly set, default to the `dev` value so devs
// get interactive docs and dev routes when DEV_MODE=true.
export const enableDocs = process.env.ENABLE_DOCS ? process.env.ENABLE_DOCS === 'true' : dev;

export const enableDevRoutes = process.env.ENABLE_DEV_ROUTES
  ? process.env.ENABLE_DEV_ROUTES === 'true'
  : dev;

export const enableEventProcessor = process.env.ENABLE_EVENT_PROCESSOR
  ? process.env.ENABLE_EVENT_PROCESSOR === 'true'
  : dev;

// Milliseconds window used to deduplicate rapid repeated player activities
// (e.g. multiple concurrent high-score events). Can be overridden by env.
export const PLAYER_ACTIVITY_DEDUPE_MS = process.env.PLAYER_ACTIVITY_DEDUPE_MS
  ? Number(process.env.PLAYER_ACTIVITY_DEDUPE_MS)
  : 5000;

// Return runtime-evaluated flags. This avoids issues where module initialization
// order (circular imports) can cause values to appear undefined during early
// startup when using ts-node-dev or similar tools. Call this from startup
// locations that need the canonical (current) env-derived values.
export function getRuntimeFlags() {
  const _dev = (process.env.DEV_MODE === 'true') || process.env.NODE_ENV === 'development';
  const _enableDocs = process.env.ENABLE_DOCS ? process.env.ENABLE_DOCS === 'true' : _dev;
  const _enableDevRoutes = process.env.ENABLE_DEV_ROUTES ? process.env.ENABLE_DEV_ROUTES === 'true' : _dev;
  const _enableEventProcessor = process.env.ENABLE_EVENT_PROCESSOR ? process.env.ENABLE_EVENT_PROCESSOR === 'true' : _dev;
  return {
    dev: _dev,
    enableDocs: _enableDocs,
    enableDevRoutes: _enableDevRoutes,
    enableEventProcessor: _enableEventProcessor,
  } as const;
}

export async function connectMongo() {
  if (!config.mongoUri) throw new Error('MONGO_URI not configured');

  // Determine DB name. Prefer explicit TEST_DB_NAME (set by global test setup),
  // then MONGO_DBNAME, then fallback to the default 'gameDB'. If TEST_DB_NAME
  // isn't in the process env (Jest spawns workers), try to read the persisted
  // name file created by the test global setup.
  let dbName = process.env.TEST_DB_NAME || process.env.MONGO_DBNAME || 'gameDB';
  if (!process.env.TEST_DB_NAME) {
    try {
      // read persisted test db name if present; resolve absolute path from cwd
      // so worker processes with different __dirname still find the file.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('node:fs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('node:path');
      const filePath = path.resolve(process.cwd(), 'tests/setup/.test_db_name');
      const persisted = fs.readFileSync(filePath, 'utf8').trim();
      if (persisted) dbName = persisted;
    } catch (err) {
      // ignore - file may not exist in non-test runs
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ignored = err;
    }
  }

  await mongoose.connect(config.mongoUri, { dbName });
  return mongoose.connection;
}
