import { createServer } from './app';
import { config } from './config';
import mongoose from 'mongoose';

let serverCloseInProgress = false;

async function start() {
  const { server } = await createServer();

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${config.port}`);
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
