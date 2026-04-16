import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// ── Cross-origin ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Structured request logging (Pino) ─────────────────────────────────────────
app.use(requestLogger);

// ── Health check ─────────────────────────────────────────────────────────────
// Used by Render to verify the service is alive
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── API routes (wired in Phase 4) ────────────────────────────────────────────
// app.use('/api/auth',      authRoutes);
// app.use('/api/links',     linkRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/:slug',         redirectRoutes);   ← must be last named route

// ── 404 + global error handler ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
