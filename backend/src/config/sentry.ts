import * as Sentry from '@sentry/node';
import { env } from './env';
import { logger } from './logger';

export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    logger.info(
      { event: 'sentry_skipped' },
      'SENTRY_DSN not set — error tracking disabled',
    );
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Capture 100% of transactions in dev/test; only 10% in production
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  logger.info(
    { event: 'sentry_initialized', environment: env.NODE_ENV },
    'Sentry error tracking initialized',
  );
}

// Re-export so the rest of the app never imports @sentry/node directly
export { Sentry };
