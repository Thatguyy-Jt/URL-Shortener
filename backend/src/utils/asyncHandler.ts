import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any rejected promise is forwarded to
 * Express's next(err) error handler. Without this wrapper, an unhandled
 * async rejection in a route handler would crash the process in Express 4.
 *
 * Express 5 handles this automatically, but we are on Express 4.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
