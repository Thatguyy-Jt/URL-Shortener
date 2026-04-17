import { ILink } from '../models/Link';
import { linkRepository } from '../repositories/linkRepository';
import { generateUniqueSlug } from './slugGenerator';
import { AppError } from '../middleware/errorHandler';

// ── Validators ────────────────────────────────────────────────────────────────

/**
 * Validates that a URL is a well-formed http or https URL.
 * Rejects ftp://, data://, javascript:// etc. intentionally.
 */
function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const CUSTOM_SLUG_PATTERN = /^[a-z0-9-]+$/i;

// ── Service ───────────────────────────────────────────────────────────────────

export const linkService = {
  /**
   * Create a new short link.
   *
   * Validation order (fail fast):
   *  1. URL must be a valid http/https URL
   *  2. expiresAt (if provided) must be in the future
   *  3. customSlug (if provided) must match the allowed pattern and be free
   *  4. If no customSlug, generate one automatically
   */
  async createLink(input: {
    originalUrl: string;
    userId?: string;
    expiresAt?: Date;
    customSlug?: string;
  }): Promise<ILink> {
    if (!isValidHttpUrl(input.originalUrl)) {
      throw new AppError(
        'Invalid URL. Must start with http:// or https:// and be a valid URL.',
        400,
      );
    }

    if (input.expiresAt && input.expiresAt <= new Date()) {
      throw new AppError('Expiry date must be in the future.', 400);
    }

    let slug: string;

    if (input.customSlug) {
      if (
        input.customSlug.length < 3 ||
        input.customSlug.length > 50 ||
        !CUSTOM_SLUG_PATTERN.test(input.customSlug)
      ) {
        throw new AppError(
          'Custom slug must be 3–50 characters and contain only letters, numbers, and hyphens.',
          400,
        );
      }

      const taken = await linkRepository.slugExists(input.customSlug);
      if (taken) {
        throw new AppError(`The slug "${input.customSlug}" is already taken.`, 409);
      }

      slug = input.customSlug.toLowerCase();
    } else {
      slug = await generateUniqueSlug();
    }

    return linkRepository.create({
      slug,
      originalUrl: input.originalUrl,
      userId: input.userId,
      expiresAt: input.expiresAt ?? null,
    });
  },

  /**
   * Resolve a slug to an active, non-expired link.
   *
   * Returns null instead of throwing so the redirect controller can serve
   * a clean 404 without generating a Sentry alert for expected misses.
   */
  async findActiveLink(slug: string): Promise<ILink | null> {
    const link = await linkRepository.findBySlug(slug);
    if (!link) return null;
    if (!link.isActive) return null;
    if (link.expiresAt && link.expiresAt < new Date()) return null;
    return link;
  },

  /** Paginated list of all links owned by a user. */
  async getUserLinks(
    userId: string,
    options?: { page?: number; limit?: number; includeInactive?: boolean },
  ) {
    return linkRepository.findByUserId(userId, options);
  },

  /** Soft-delete: set isActive=false. Throws 404 if not found or not owned. */
  async deactivateLink(linkId: string, userId: string): Promise<ILink> {
    const link = await linkRepository.deactivate(linkId, userId);
    if (!link) throw new AppError('Link not found or you do not have permission.', 404);
    return link;
  },

  /** Hard delete. Throws 404 if not found or not owned. */
  async deleteLink(linkId: string, userId: string): Promise<void> {
    const deleted = await linkRepository.deleteById(linkId, userId);
    if (!deleted) throw new AppError('Link not found or you do not have permission.', 404);
  },

  /**
   * Fetch a single link by ID, verifying the requesting user owns it.
   * Used by the analytics controller to gate access to per-link data.
   */
  async getLinkById(linkId: string, userId: string): Promise<ILink> {
    const link = await linkRepository.findById(linkId);
    if (!link) throw new AppError('Link not found.', 404);
    if (link.userId?.toString() !== userId) {
      throw new AppError('You do not have permission to access this link.', 403);
    }
    return link;
  },

  /** Update the expiry date. Pass null to remove the expiry entirely. */
  async updateLinkExpiry(
    linkId: string,
    userId: string,
    expiresAt: Date | null,
  ): Promise<ILink> {
    if (expiresAt && expiresAt <= new Date()) {
      throw new AppError('Expiry date must be in the future.', 400);
    }
    const link = await linkRepository.updateExpiry(linkId, userId, expiresAt);
    if (!link) throw new AppError('Link not found or you do not have permission.', 404);
    return link;
  },
};
