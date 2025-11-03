import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { Server as IOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config, connectMongo } from './config/index';
import { errorHandler } from './middleware/error-handler';
import passport from './config/passport';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes';
import playersRoutes from './routes/players.routes';
import leaderboardsRoutes from './routes/leaderboards.routes';
import storeRoutes from './routes/store.routes';
import eventsRoutes from './routes/events.routes';
import rulesRoutes from './routes/rules.routes';
import violationsRoutes from './routes/violations.routes';
import notificationsRoutes from './routes/notifications.routes';
import groupsRoutes from './routes/groups.routes';
import offersRoutes from './routes/offers.routes';
import guestsRoutes from './routes/guests.routes';
import { startEventProcessor, stopEventProcessor } from './jobs/process-event-logs.job';
import { startGuestCleanup, stopGuestCleanup } from './jobs/guest-cleanup.job';

export async function createServer() {
  await connectMongo();

  const app = express();
  app.use(helmet());
  app.use(express.json());
  app.use(cors({ origin: config.frontendUrl }));
  app.use(passport.initialize());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
    })
  );

  app.get('/_health', (req, res) => res.json({ ok: true }));

  // Optionally serve API docs (Redoc + Swagger) during development from the OpenAPI spec.
  // Controlled by the ENABLE_DOCS env var (set to 'true' to enable). This prevents
  // exposing interactive docs in production by default.
  // Compute runtime flags and enable features accordingly. Use a runtime require
  // to avoid circular import initialization problems with ts-node-dev.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cfg = require('./config');
  // support both CommonJS and transpiled/ESModule interop shapes
  // (cfg.getRuntimeFlags) or (cfg.default.getRuntimeFlags)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const getRuntimeFlags = cfg.getRuntimeFlags || cfg.default?.getRuntimeFlags;
  // eslint-disable-next-line no-console
  console.info('[startup] config exports:', Object.keys(cfg));
  if (typeof getRuntimeFlags !== 'function') {
    throw new TypeError('getRuntimeFlags is not available from config module');
  }
  const { dev, enableDocs, enableDevRoutes, enableEventProcessor } = getRuntimeFlags();

  // Enable docs when the config flag is true (controlled via .env or defaults to dev).
  if (enableDocs) {
    // Restrict docs to RFC1918/private addresses and loopback (dev-only safety)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requirePrivateNetwork } = require('./middleware/private-net');

  // Some environments (helmet or proxy) apply a strict Content-Security-Policy
  // which blocks external CDN scripts used by the static Swagger UI and ReDoc
  // pages. To avoid requiring unsafe-inline or CDN access we serve local copies
  // of the vendor files (swagger-ui and js-yaml) from node_modules under
  // /docs/vendor. This allows the docs page to load scripts/styles from
  // 'self' and avoids CSP violations during local development.
  // Serve vendor assets from node_modules so the UI doesn't rely on CDN.
  app.use('/docs/vendor/swagger-ui-dist', express.static(path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist')));
  app.use('/docs/vendor/js-yaml', express.static(path.join(__dirname, '..', 'node_modules', 'js-yaml', 'dist')));
  const setDocsCSP = (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Allow scripts/styles from jsdelivr CDN for dev docs; keep other
      // directives tightly scoped to 'self'. Note: this is only applied to
      // the /docs route (dev-only) and is not intended for production.
      // Restrict all resources to same-origin. Since we now serve the
      // Swagger UI and js-yaml locally under /docs/vendor, 'self' is sufficient
      // and we avoid needing 'unsafe-inline' or external CDNs.
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; base-uri 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';"
      );
      return next();
    };

    app.use('/docs', requirePrivateNetwork, setDocsCSP, express.static(path.join(__dirname, '../public')));
    app.get('/docs', requirePrivateNetwork, setDocsCSP, (req, res) => res.sendFile(path.join(__dirname, '../public/redoc.html')));
    // Lightweight server-side check endpoint for the OpenAPI spec. Useful when
    // debugging Swagger UI blank pages: it returns whether the file exists and
    // a small snippet so you can confirm the server can read the spec.
    app.get('/_openapi_check', requirePrivateNetwork, async (req, res) => {
      const specPath = path.join(__dirname, '../public/openapi.yaml');
      try {
        const buf = await fs.promises.readFile(specPath, { encoding: 'utf8' });
        return res.json({ ok: true, size: buf.length, snippet: buf.slice(0, 1024) });
      } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
      }
    });
    // Serve the OpenAPI spec as JSON for tools that prefer JSON-formatted specs
    // The route is mounted under /docs so clients can request /docs/openapi.json
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const docsRouter = require('./routes/docs.routes').default;
    app.use('/docs', requirePrivateNetwork, setDocsCSP, docsRouter);
  }

  app.use('/v1/auth', authRoutes);
  app.use('/v1/players', playersRoutes);
  app.use('/v1/leaderboards', leaderboardsRoutes);
  app.use('/v1/store', storeRoutes);
  app.use('/v1/events', eventsRoutes);
  app.use('/v1/rules', rulesRoutes);
  app.use('/v1/violations', violationsRoutes);
  app.use('/v1/notifications', notificationsRoutes);
  app.use('/v1/groups', groupsRoutes);
  app.use('/v1/offers', offersRoutes);
  app.use('/v1/guests', guestsRoutes);
  // Mount newly added routes for player-scores and user-storage
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const playerScoresRoutes = require('./routes/player-scores.routes').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const userStorageRoutes = require('./routes/user-storage.routes').default;
  app.use('/v1/player-scores', playerScoresRoutes);
  app.use('/v1/user-storage', userStorageRoutes);

  // Dev-only debug endpoints (mint test tokens, etc.). Enabled with ENABLE_DEV_ROUTES=true
  if (enableDevRoutes) {
    // lazy import to avoid shipping this route in prod
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const debugRoutes = require('./routes/debug.routes').default;
    // ensure debug endpoints are accessible only from private network
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requirePrivateNetwork } = require('./middleware/private-net');
    app.use('/v1/debug', requirePrivateNetwork, debugRoutes);

    // Mount small admin-only route collection when dev routes are enabled.
    // This is intentionally gated behind ENABLE_DEV_ROUTES to avoid exposing admin
    // endpoints in production. The routes are lazily required to avoid shipping
    // the module when not in use.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const adminRoutes = require('./routes/admin.routes').default;
    app.use('/v1/admin', requirePrivateNetwork, adminRoutes);
  }

  // start guest cleanup job (runs daily) to remove stale guest sessions
  startGuestCleanup();

  app.use(errorHandler);

  const server = http.createServer(app);
  const io = new IOServer(server, { cors: { origin: config.frontendUrl } });
  // expose io to routes via app.locals with a narrow local type
  const typedApp = app as express.Application & { locals: { io?: IOServer } };
  typedApp.locals.io = io;

  // Startup visibility: compute the flags at runtime and print them. Using a
  // runtime helper avoids circular-init problems that can make the module-level
  // exported booleans appear undefined under some dev reloaders. Also print
  // the raw env values to help diagnose malformed `.env` files.
  // eslint-disable-next-line no-console
  console.info('[startup] flags:', { dev, enableDocs, enableDevRoutes, enableEventProcessor });
  // eslint-disable-next-line no-console
  console.info('[startup] raw env:', {
    DEV_MODE: process.env.DEV_MODE,
    NODE_ENV: process.env.NODE_ENV,
    ENABLE_DOCS: process.env.ENABLE_DOCS,
    ENABLE_DEV_ROUTES: process.env.ENABLE_DEV_ROUTES,
    ENABLE_EVENT_PROCESSOR: process.env.ENABLE_EVENT_PROCESSOR,
  });

  // Optionally start background event processor (useful for local/dev).
  // Controlled by the `enableEventProcessor` config flag (from .env or defaults to dev).
  if (enableEventProcessor) {
    // Allow overriding the poll interval for faster testing via PROCESSOR_POLL_MS (ms)
    const envMs = process.env.PROCESSOR_POLL_MS ? Number(process.env.PROCESSOR_POLL_MS) : undefined;
    if (envMs && !Number.isNaN(envMs) && envMs > 0) {
      startEventProcessor(envMs);
    } else {
      startEventProcessor();
    }
  }

  // Ensure any background processors are stopped and MongoDB is disconnected when the server closes.
  server.on('close', () => {
    if (process.env.ENABLE_EVENT_PROCESSOR === 'true') {
      try {
        stopEventProcessor();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error stopping event processor during server close', e);
      }
    }

    mongoose.disconnect().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error disconnecting mongoose during server close', err);
    });

    // stop guest cleanup when server closes
    try {
      stopGuestCleanup();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error stopping guest cleanup', e);
    }
  });

  return { app, server, io };
}
