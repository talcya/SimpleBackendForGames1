import express from 'express';
import http from 'http';
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

  app.use('/v1/auth', authRoutes);
  app.use('/v1/players', playersRoutes);

  app.use(errorHandler);

  const server = http.createServer(app);
  const io = new IOServer(server, { cors: { origin: config.frontendUrl } });
  // expose io to routes via app.locals with a narrow local type
  const typedApp = app as express.Application & { locals: { io?: IOServer } };
  typedApp.locals.io = io;

  // Optionally start background event processor (useful for local/dev).
  // Enable by setting ENABLE_EVENT_PROCESSOR=true in env.
  if (process.env.ENABLE_EVENT_PROCESSOR === 'true') {
    startEventProcessor();
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
