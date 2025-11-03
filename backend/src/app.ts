import express from 'express';
import path from 'node:path';
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
import { startEventProcessor, stopEventProcessor } from './jobs/process-event-logs.job';

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

  // Serve API docs (Redoc) during development from the OpenAPI spec.
  // The spec is placed in `backend/public/openapi.yaml` and the Redoc HTML
  // is available at GET /docs
  app.use('/docs', express.static(path.join(__dirname, '../public')));
  app.get('/docs', (req, res) => res.sendFile(path.join(__dirname, '../public/redoc.html')));

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

  app.use(errorHandler);

  const server = http.createServer(app);
  const io = new IOServer(server, { cors: { origin: config.frontendUrl } });
  // expose io to routes via app.locals with a narrow local type
  const typedApp = app as express.Application & { locals: { io?: IOServer } };
  typedApp.locals.io = io;

  // Optionally start background event processor (useful for local/dev).
  // Enable by setting ENABLE_EVENT_PROCESSOR=true in env.
  if (process.env.ENABLE_EVENT_PROCESSOR === 'true') {
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
  });

  return { app, server, io };
}
