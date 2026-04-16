/**
 * Jest global setup — runs before every test file is imported.
 *
 * Sets the minimum required environment variables so env.ts validation
 * passes without a real .env file present in CI or during unit tests.
 * Integration tests that need a real DB connection use a separate .env.test.
 */
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/url-shortener-test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long!!';
process.env.REDIS_URL = 'redis://localhost:6379';
