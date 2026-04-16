import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';
import { logger } from '../config/logger';

/**
 * AppError is an operational error — expected problems like "link not found"
 * or "invalid input". These are logged but NOT sent to Sentry because they
 * are not bugs; they are expected application behaviour.
 *
 * Any other Error subclass is treated as a programmer error and IS sent to
 * Sentry so the team gets notified.
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Express recognises a 4-argument middleware as an error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? (err as AppError).statusCode : 500;

  logger.error(
    {
      err,
      requestId: (req as { id?: string }).id,
      method: req.method,
      path: req.path,
    },
    isOperational ? 'Operational error' : 'Unexpected error',
  );

  // Only programmer errors (non-operational) go to Sentry
  if (!isOperational) {
    Sentry.captureException(err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message:
        isOperational || process.env.NODE_ENV !== 'production'
          ? err.message
          : 'Internal server error',
      // Expose stack trace in non-production environments for easier debugging
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
