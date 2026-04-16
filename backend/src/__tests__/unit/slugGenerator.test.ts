/**
 * slugGenerator.test.ts  — written BEFORE the implementation (TDD)
 *
 * Tests cover:
 *   - generateSlug: pure random string generation
 *   - generateUniqueSlug: collision-aware slug with DB lookup
 */

import { generateSlug, generateUniqueSlug } from '../../services/slugGenerator';
import { linkRepository } from '../../repositories/linkRepository';

jest.mock('../../repositories/linkRepository');

const mockRepo = jest.mocked(linkRepository);

// ── generateSlug (pure, no DB) ────────────────────────────────────────────────

describe('generateSlug', () => {
  it('generates a string of the default length (6)', () => {
    expect(generateSlug()).toHaveLength(6);
  });

  it('generates a string of a custom length', () => {
    expect(generateSlug(8)).toHaveLength(8);
    expect(generateSlug(4)).toHaveLength(4);
  });

  it('only contains lowercase alphanumeric characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSlug()).toMatch(/^[a-z0-9]+$/);
    }
  });

  it('produces different slugs on repeated calls', () => {
    // With 36^6 ≈ 2.2 billion possibilities, all 20 being identical is impossible
    const slugs = new Set(Array.from({ length: 20 }, () => generateSlug()));
    expect(slugs.size).toBeGreaterThan(1);
  });
});

// ── generateUniqueSlug (DB-checked) ──────────────────────────────────────────

describe('generateUniqueSlug', () => {
  it('returns a valid slug when no collision occurs', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);

    const slug = await generateUniqueSlug();

    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(1);
    expect(slug).toMatch(/^[a-z0-9]{6}$/);
  });

  it('retries on slug collision and succeeds on the second attempt', async () => {
    mockRepo.findBySlug
      .mockResolvedValueOnce({ slug: 'abc123' } as any) // first slug taken
      .mockResolvedValueOnce(null);                      // second slug free

    const slug = await generateUniqueSlug();

    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(2);
    expect(slug).toBeDefined();
    expect(slug).toMatch(/^[a-z0-9]{6}$/);
  });

  it('handles multiple consecutive collisions before finding a free slug', async () => {
    mockRepo.findBySlug
      .mockResolvedValueOnce({ slug: 'aaa111' } as any)
      .mockResolvedValueOnce({ slug: 'bbb222' } as any)
      .mockResolvedValueOnce({ slug: 'ccc333' } as any)
      .mockResolvedValueOnce(null); // fourth attempt succeeds

    const slug = await generateUniqueSlug();

    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(4);
    expect(slug).toBeDefined();
  });

  it('throws after max retry attempts are all exhausted', async () => {
    // Every slug is "taken" — simulates an extremely full namespace
    mockRepo.findBySlug.mockResolvedValue({ slug: 'taken' } as any);

    await expect(generateUniqueSlug()).rejects.toThrow(
      /Could not generate a unique slug/i,
    );

    // Default maxRetries is 5 — exactly 5 lookups should be made
    expect(mockRepo.findBySlug).toHaveBeenCalledTimes(5);
  });

  it('respects a custom slug length', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);

    const slug = await generateUniqueSlug(8);

    expect(slug).toHaveLength(8);
  });
});
