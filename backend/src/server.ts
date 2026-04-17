import { env } from './config/env';
import { logger } from './config/logger';
import { initSentry } from './config/sentry';
import { connectDatabase } from './config/database';
import app from './app';

async function start(): Promise<void> {
  // 1. Sentry must be initialised first so any startup errors are captured
  initSentry();

  // 2. Connect to MongoDB — exits the process if the connection fails
  await connectDatabase();

  // 3. Start HTTP server
  const server = app.listen(Number(env.PORT), () => {
    logger.info(
      { event: 'server_started', port: env.PORT, env: env.NODE_ENV },
      `Server listening on port ${env.PORT}`,
    );
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  // On SIGTERM / SIGINT, stop accepting new connections and let in-flight
  // requests finish before closing the DB connection and exiting.
  const shutdown = (signal: string) => {
    logger.info({ event: 'shutdown_signal', signal }, 'Shutdown signal received');
    server.close(() => {
      logger.info({ event: 'server_closed' }, 'HTTP server closed — exiting');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled errors ───────────────────────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    // Redis is an optional service — a connection refusal should never
    // bring the whole server down.  The click-queue module degrades
    // gracefully to direct MongoDB writes when Redis is unavailable.
    const code = (reason as NodeJS.ErrnoException)?.code;
    if (code === 'ECONNREFUSED') {
      logger.warn(
        { event: 'optional_service_unavailable', code },
        'Connection refused to an optional service (Redis?) — server continues',
      );
      return;
    }

    logger.error(
      { event: 'unhandled_rejection', reason },
      'Unhandled promise rejection — shutting down',
    );
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.error(
      { event: 'uncaught_exception', err },
      'Uncaught exception — shutting down',
    );
    process.exit(1);
  });
}

start().catch((err) => {
  // logger may not be available if env parsing failed, so fall back to console
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
