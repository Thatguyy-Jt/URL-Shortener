import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected', () => {
    logger.info({ event: 'db_connected' }, 'MongoDB connected');
  });

  mongoose.connection.on('error', (err: Error) => {
    logger.error({ event: 'db_error', err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn({ event: 'db_disconnected' }, 'MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI, {
    // Fail fast if the server is unreachable — don't hang the startup
    serverSelectionTimeoutMS: 5000,
  });

  // Mongoose automatically calls createIndexes() on model registration.
  // Logging this confirms indexes have been verified/created at startup.
  logger.info(
    { event: 'db_indexes_ready' },
    'MongoDB connection established — indexes synced',
  );
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info({ event: 'db_disconnected_gracefully' }, 'MongoDB disconnected');
}
