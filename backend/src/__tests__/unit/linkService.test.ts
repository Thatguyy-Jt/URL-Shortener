/**
 * linkService.test.ts  — written BEFORE the implementation (TDD)
 *
 * Tests cover:
 *   - createLink: URL validation, expiry validation, slug resolution
 *   - findActiveLink: status and expiry gating
 */

import { Types } from 'mongoose';
import { linkService } from '../../services/linkService';
import { linkRepository } from '../../repositories/linkRepository';
import { generateUniqueSlug } from '../../services/slugGenerator';
import { ILink } from '../../models/Link';

jest.mock('../../repositories/linkRepository');
jest.mock('../../services/slugGenerator');

const mockRepo = jest.mocked(linkRepository);
const mockGenerateUniqueSlug = jest.mocked(generateUniqueSlug);

// ── Shared fixture ────────────────────────────────────────────────────────────

const baseLink: ILink = {
  _id: new Types.ObjectId(),
  slug: 'abc123',
  originalUrl: 'https://www.example.com',
  userId: new Types.ObjectId(),
  isActive: true,
  expiresAt: null,
  clickCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── linkService.createLink ────────────────────────────────────────────────────

describe('linkService.createLink', () => {
  it('throws AppError 400 for a completely invalid URL string', async () => {
    await expect(
      linkService.createLink({ originalUrl: 'not-a-url' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringMatching(/invalid url/i),
    });
  });

  it('throws AppError 400 for a URL with a non-http/https protocol', async () => {
    await expect(
      linkService.createLink({ originalUrl: 'ftp://files.example.com' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws AppError 400 when expiresAt is in the past', async () => {
    const pastDate = new Date(Date.now() - 60_000); // 1 minute ago

    await expect(
      linkService.createLink({
        originalUrl: 'https://example.com',
        expiresAt: pastDate,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringMatching(/future/i),
    });
  });

  it('throws AppError 400 when expiresAt is exactly now (not in the future)', async () => {
    // new Date() inside the service will be slightly after this, so it counts as past
    const rightNow = new Date(Date.now() - 1);

    await expect(
      linkService.createLink({
        originalUrl: 'https://example.com',
        expiresAt: rightNow,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws AppError 409 when a custom slug is already taken', async () => {
    mockRepo.slugExists.mockResolvedValue(true);

    await expect(
      linkService.createLink({
        originalUrl: 'https://example.com',
        customSlug: 'my-link',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('uses the custom slug when it is available', async () => {
    mockRepo.slugExists.mockResolvedValue(false);
    mockRepo.create.mockResolvedValue({ ...baseLink, slug: 'my-link' });

    const link = await linkService.createLink({
      originalUrl: 'https://example.com',
      customSlug: 'my-link',
    });

    expect(link.slug).toBe('my-link');
    expect(mockGenerateUniqueSlug).not.toHaveBeenCalled();
  });

  it('auto-generates a slug when no custom slug is provided', async () => {
    mockGenerateUniqueSlug.mockResolvedValue('gen456');
    mockRepo.create.mockResolvedValue({ ...baseLink, slug: 'gen456' });

    const link = await linkService.createLink({ originalUrl: 'https://example.com' });

    expect(mockGenerateUniqueSlug).toHaveBeenCalledTimes(1);
    expect(link.slug).toBe('gen456');
  });

  it('returns a link object with the expected shape', async () => {
    mockGenerateUniqueSlug.mockResolvedValue('xyz789');
    mockRepo.create.mockResolvedValue(baseLink);

    const link = await linkService.createLink({ originalUrl: 'https://example.com' });

    expect(link).toMatchObject({
      slug: expect.any(String),
      originalUrl: expect.any(String),
      isActive: true,
      clickCount: 0,
    });
  });

  it('passes the userId and expiresAt to the repository', async () => {
    const userId = new Types.ObjectId().toString();
    const expiresAt = new Date(Date.now() + 86_400_000); // 24h from now
    mockGenerateUniqueSlug.mockResolvedValue('abc999');
    mockRepo.create.mockResolvedValue({ ...baseLink, userId: new Types.ObjectId(userId) });

    await linkService.createLink({ originalUrl: 'https://example.com', userId, expiresAt });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, expiresAt }),
    );
  });
});

// ── linkService.findActiveLink ────────────────────────────────────────────────

describe('linkService.findActiveLink', () => {
  it('returns null when the slug does not exist in the database', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);

    expect(await linkService.findActiveLink('nonexistent')).toBeNull();
  });

  it('returns null when the link exists but isActive is false', async () => {
    mockRepo.findBySlug.mockResolvedValue({ ...baseLink, isActive: false });

    expect(await linkService.findActiveLink('abc123')).toBeNull();
  });

  it('returns null when the link has expired (expiresAt in the past)', async () => {
    const expiredLink: ILink = {
      ...baseLink,
      expiresAt: new Date(Date.now() - 60_000), // 1 minute ago
    };
    mockRepo.findBySlug.mockResolvedValue(expiredLink);

    expect(await linkService.findActiveLink('abc123')).toBeNull();
  });

  it('returns the link when it is active with no expiry set', async () => {
    mockRepo.findBySlug.mockResolvedValue(baseLink); // expiresAt: null

    expect(await linkService.findActiveLink('abc123')).toEqual(baseLink);
  });

  it('returns the link when it is active and expiry is in the future', async () => {
    const futureLink: ILink = {
      ...baseLink,
      expiresAt: new Date(Date.now() + 86_400_000), // 24 hours from now
    };
    mockRepo.findBySlug.mockResolvedValue(futureLink);

    expect(await linkService.findActiveLink('abc123')).toEqual(futureLink);
  });
});

// ── linkService.getLinkById ───────────────────────────────────────────────────

describe('linkService.getLinkById', () => {
  const ownerId = new Types.ObjectId().toString();
  const linkId = new Types.ObjectId().toString();

  it('returns the link when it exists and the requesting user owns it', async () => {
    const ownedLink: ILink = { ...baseLink, userId: new Types.ObjectId(ownerId) };
    mockRepo.findById.mockResolvedValue(ownedLink);

    const result = await linkService.getLinkById(linkId, ownerId);

    expect(result).toEqual(ownedLink);
    expect(mockRepo.findById).toHaveBeenCalledWith(linkId);
  });

  it('throws AppError 404 when the link does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(linkService.getLinkById(linkId, ownerId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws AppError 403 when the authenticated user does not own the link', async () => {
    const differentUser = new Types.ObjectId().toString();
    const unownedLink: ILink = { ...baseLink, userId: new Types.ObjectId(differentUser) };
    mockRepo.findById.mockResolvedValue(unownedLink);

    await expect(linkService.getLinkById(linkId, ownerId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('throws AppError 403 for anonymous links (userId is null)', async () => {
    const anonymousLink: ILink = { ...baseLink, userId: null };
    mockRepo.findById.mockResolvedValue(anonymousLink);

    await expect(linkService.getLinkById(linkId, ownerId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
