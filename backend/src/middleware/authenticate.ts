import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

interface JwtPayload {
  userId: string;
  email: string;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

/**
 * Require a valid JWT Bearer token.
 * Sets req.user = { userId, email } on success.
 * Passes a 401 AppError to next() on failure so the global error handler
 * returns a consistent JSON error shape.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError('Authentication required. Provide a Bearer token.', 401));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    next(new AppError('Invalid or expired authentication token.', 401));
  }
}

/**
 * Like authenticate, but does NOT fail if no token is present.
 * Useful for endpoints that are public but provide extra features when
 * the user is logged in (e.g. anonymous link creation vs. owned link).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { userId: payload.userId, email: payload.email };
  } catch {
    // Treat an invalid token the same as no token for optional auth
  }

  next();
}
