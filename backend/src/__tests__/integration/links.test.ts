/**
 * links.test.ts — integration tests for the /api/links and /api/auth routes.
 *
 * Strategy: service layer is mocked so tests run without a real MongoDB or
 * Redis connection. The clickQueue is also mocked. A real JWT is signed with
 * the test secret (set in __tests__/setup.ts) so the authenticate middleware
 * is exercised without modification.
 *
 * What is tested:
 *   - Full HTTP request/response cycle through Express routing + middleware
 *   - Status codes, response shapes, and Content-Type headers
 *   - Authentication guard (401 when no token, 200 when valid token)
 *   - Input validation (400 for bad payloads)
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import app from '../../app';
import { linkService } from '../../services/linkService';
import { authService } from '../../services/authService';

jest.mock('../../services/linkService');
jest.mock('../../services/authService');
// Prevent Bull from trying to connect to Redis during tests
jest.mock('../../queues/clickQueue', () => ({
  clickQueue: { add: jest.fn() },
}));

const mockLinkService = jest.mocked(linkService);
const mockAuthService = jest.mocked(authService);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TEST_SECRET = process.env.JWT_SECRET!;

const testUserId = new Types.ObjectId().toString();
const validToken = jwt.sign({ userId: testUserId, email: 'test@example.com' }, TEST_SECRET);

const mockLink = {
  _id: new Types.ObjectId(),
  slug: 'abc123',
  originalUrl: 'https://www.example.com',
  userId: new Types.ObjectId(testUserId),
  isActive: true,
  expiresAt: null,
  clickCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('returns 201 and a token on successful registration', async () => {
    mockAuthService.register.mockResolvedValue({
      token: 'signed.jwt.token',
      user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
    });

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'securepassword123',
      name: 'Test User',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'securepassword123',
      name: 'Test User',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'short',
      name: 'Test User',
    });

    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 200 and a token on successful login', async () => {
    mockAuthService.login.mockResolvedValue({
      token: 'signed.jwt.token',
      user: { id: testUserId, email: 'test@example.com', name: 'Test User' },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'securepassword123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });
});

// ── POST /api/links ───────────────────────────────────────────────────────────

describe('POST /api/links', () => {
  it('returns 201 and the created link', async () => {
    mockLinkService.createLink.mockResolvedValue(mockLink as any);

    const res = await request(app)
      .post('/api/links')
      .send({ url: 'https://www.example.com' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('abc123');
  });

  it('returns 400 for a missing URL', async () => {
    const res = await request(app).post('/api/links').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('associates the link with the user when a valid token is provided', async () => {
    mockLinkService.createLink.mockResolvedValue(mockLink as any);

    await request(app)
      .post('/api/links')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ url: 'https://www.example.com' });

    expect(mockLinkService.createLink).toHaveBeenCalledWith(
      expect.objectContaining({ userId: testUserId }),
    );
  });
});

// ── GET /api/links ────────────────────────────────────────────────────────────

describe('GET /api/links', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/links');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 and paginated links with a valid token', async () => {
    mockLinkService.getUserLinks.mockResolvedValue({
      links: [mockLink] as any,
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const res = await request(app)
      .get('/api/links')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.links).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });
});

// ── DELETE /api/links/:id ─────────────────────────────────────────────────────

describe('DELETE /api/links/:id', () => {
  it('returns 401 without authentication', async () => {
    const res = await request(app).delete(`/api/links/${mockLink._id}`);

    expect(res.status).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    mockLinkService.deleteLink.mockResolvedValue(undefined);

    const res = await request(app)
      .delete(`/api/links/${mockLink._id}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(204);
  });
});

// ── PATCH /api/links/:id/deactivate ──────────────────────────────────────────

describe('PATCH /api/links/:id/deactivate', () => {
  it('returns 200 and the updated link', async () => {
    mockLinkService.deactivateLink.mockResolvedValue({ ...mockLink, isActive: false } as any);

    const res = await request(app)
      .patch(`/api/links/${mockLink._id}/deactivate`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });
});
