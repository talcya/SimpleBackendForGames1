import { config } from './config';
// use runtime require for flags to avoid circular-init issues with ts-node-dev
import { createServer } from './app';
import mongoose from 'mongoose';

let serverCloseInProgress = false;

async function start() {
  const { server } = await createServer();

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    const msg = `Backend listening on http://localhost:${config.port}`;
    console.log(msg);
    // also write directly to stdout to avoid any buffering issues in child process listeners
    try {
      process.stdout.write(msg + '\n');
    } catch {
      // ignore write errors in some test harnesses
    }
    // If docs are enabled, print the useful developer URLs so it's easy to open in a browser.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require('./config');
    const getRuntimeFlags = cfg.getRuntimeFlags || cfg.default?.getRuntimeFlags;
    if (typeof getRuntimeFlags !== 'function') {
      throw new TypeError('getRuntimeFlags is not available from config module');
    }
    const { enableDocs, enableDevRoutes } = getRuntimeFlags();
  // Defensive fallback: treat docs as enabled if DEV_MODE or NODE_ENV indicate development
  const docsEnabled = typeof enableDocs === 'boolean' ? enableDocs : ((process.env.DEV_MODE === 'true') || process.env.NODE_ENV === 'development');
  const devRoutesEnabled = typeof enableDevRoutes === 'boolean' ? enableDevRoutes : ((process.env.DEV_MODE === 'true') || process.env.NODE_ENV === 'development');
  if (docsEnabled) {
      // eslint-disable-next-line no-console
      console.info('[startup] developer docs:');
      // ReDoc readable docs
      // eslint-disable-next-line no-console
      console.info(`  ReDoc: http://localhost:${config.port}/docs`);
      // Swagger UI interactive (if present)
      // eslint-disable-next-line no-console
      console.info(`  Swagger UI: http://localhost:${config.port}/docs/swagger.html`);
      // Raw OpenAPI spec
      // eslint-disable-next-line no-console
      console.info(`  OpenAPI spec: http://localhost:${config.port}/docs/openapi.yaml`);
  if (devRoutesEnabled) {
        // debug token endpoint
        // eslint-disable-next-line no-console
        console.info(`  Dev token endpoint: http://localhost:${config.port}/v1/debug/token?email=alice@example.com`);
      }
    }
  });

  const shutdown = (signal: string) => {
    if (serverCloseInProgress) return;
    serverCloseInProgress = true;
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}. Closing server and cleaning up...`);

    // Stop accepting new connections, wait for existing to finish
    server.close((err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Error while closing server:', err);
        process.exit(1);
      }

      // Disconnect mongoose
      mongoose
        .disconnect()
        .then(() => {
          // eslint-disable-next-line no-console
          console.log('MongoDB disconnected. Exiting.');
          process.exit(0);
        })
        .catch((error_) => {
          // eslint-disable-next-line no-console
          console.error('Error disconnecting MongoDB:', error_);
          process.exit(1);
        });
    });

    // Force exit if shutdown hangs
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error('Forcing process exit after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
