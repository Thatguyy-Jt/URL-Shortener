import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import linkRoutes from './routes/linkRoutes';
import redirectRoutes from './routes/redirectRoutes';

const app = express();

// ── Trust proxy ───────────────────────────────────────────────────────────────
// Required when deployed behind Render / Nginx so req.ip reflects the real
// client IP instead of the proxy IP (important for geo-lookup accuracy).
app.set('trust proxy', 1);

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
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.NODE_ENV });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);

// ── Redirect route — MUST be last so it doesn't shadow /api/* paths ──────────
app.use('/', redirectRoutes);

// ── 404 + global error handler ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
