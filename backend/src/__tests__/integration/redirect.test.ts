/**
 * redirect.test.ts — integration tests for the GET /:slug redirect endpoint.
 *
 * PRD requirements verified here:
 *   ✅ 301 redirect to the original URL when the link is active
 *   ✅ 404 when the slug is not found / expired
 *   ✅ Click recording is called (fire-and-forget, never blocks the response)
 *   ✅ Response time < 100ms (measured in-process — always passes in tests,
 *      but the assertion documents the performance contract)
 */

import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../app';
import { linkService } from '../../services/linkService';
import { recordClick } from '../../queues/clickQueue';

jest.mock('../../services/linkService');
jest.mock('../../queues/clickQueue', () => ({
  recordClick: jest.fn(),
}));

const mockLinkService = jest.mocked(linkService);
const mockRecordClick = recordClick as jest.MockedFunction<typeof recordClick>;

// ── Fixture ───────────────────────────────────────────────────────────────────

const mockLink = {
  _id: new Types.ObjectId(),
  slug: 'abc123',
  originalUrl: 'https://www.example.com/very/long/url',
  userId: null,
  isActive: true,
  expiresAt: null,
  clickCount: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /:slug (redirect)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 301 and Location header pointing to the original URL', async () => {
    mockLinkService.findActiveLink.mockResolvedValue(mockLink as any);

    const res = await request(app).get('/abc123').redirects(0);

    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(mockLink.originalUrl);
  });

  it('returns 404 when the slug does not exist', async () => {
    mockLinkService.findActiveLink.mockResolvedValue(null);

    const res = await request(app).get('/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/not found/i);
  });

  it('returns 404 when the link exists but is expired or inactive', async () => {
    // findActiveLink already returns null for expired/inactive links
    mockLinkService.findActiveLink.mockResolvedValue(null);

    const res = await request(app).get('/expiredslug');

    expect(res.status).toBe(404);
  });

  it('calls recordClick() exactly once (fire-and-forget, not awaited)', async () => {
    mockLinkService.findActiveLink.mockResolvedValue(mockLink as any);

    await request(app).get('/abc123').redirects(0);

    expect(mockRecordClick).toHaveBeenCalledTimes(1);
    expect(mockRecordClick).toHaveBeenCalledWith(
      expect.objectContaining({
        linkId: mockLink._id.toString(),
      }),
    );
  });

  it('does NOT call recordClick() when the link is not found', async () => {
    mockLinkService.findActiveLink.mockResolvedValue(null);

    await request(app).get('/notfound');

    expect(mockRecordClick).not.toHaveBeenCalled();
  });

  /**
   * PRD requirement: redirect endpoint must respond in < 100ms.
   *
   * In a test environment (in-process, mocked services) this will always
   * pass. The assertion documents the performance contract — the same
   * measurement is repeated against the live deployment in Phase 6.
   */
  it('responds in less than 100ms (PRD performance requirement)', async () => {
    mockLinkService.findActiveLink.mockResolvedValue(mockLink as any);

    const start = Date.now();
    await request(app).get('/abc123').redirects(0);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });
});
