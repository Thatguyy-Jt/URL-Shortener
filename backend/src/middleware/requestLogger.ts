import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';

/**
 * Every request produces a structured JSON log entry containing:
 *   requestId, method, path, statusCode, responseTimeMs, userId (if authed)
 *
 * The requestId is taken from the incoming X-Request-ID header (useful when
 * sitting behind a proxy/load-balancer) or generated fresh as a UUID.
 *
 * After the authenticate middleware runs, req.user is available. The
 * customProps hook is called when the response finishes, so userId is always
 * captured if the user was authenticated for that request.
 */
export const requestLogger = pinoHttp({
  logger,

  genReqId: (req) => {
    return (req.headers['x-request-id'] as string) ?? randomUUID();
  },

  // Runs after the response is finished — req.user is set by then
  customProps: (req) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userId: (req as any).user?.id ?? undefined,
  }),

  serializers: {
    req(req) {
      return {
        requestId: req.id,
        method: req.method,
        path: req.url,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },

  customSuccessMessage(_req, res, responseTime) {
    return `${res.statusCode} — ${responseTime}ms`;
  },

  customErrorMessage(_req, res, err) {
    return `${res.statusCode} — ${err.message}`;
  },
});
