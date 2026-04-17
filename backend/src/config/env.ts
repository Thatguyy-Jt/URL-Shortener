import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Resolve the .env file relative to this file's location so the path is
// always correct regardless of the process working directory or how
// ts-node-dev spawns child processes.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('5000'),
  BASE_URL: z.string().default('http://localhost:5000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // MongoDB — not using z.string().url() because mongodb:// is non-standard HTTP
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Auth
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long'),

  // Redis for Bull queue
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Optional — Sentry DSN (empty string disables Sentry)
  SENTRY_DSN: z.string().optional(),

  // Optional — IP geolocation API key
  IPAPI_KEY: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌  Invalid environment variables — fix these before starting:\n');
  const errors = result.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([key, messages]) => {
    console.error(`  ${key}: ${messages?.join(', ')}`);
  });
  console.error('\nSee .env.example for reference.\n');
  process.exit(1);
}

export const env = result.data;
export type Env = typeof env;
