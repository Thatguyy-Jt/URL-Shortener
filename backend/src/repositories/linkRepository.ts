import { Types } from 'mongoose';
import { Link, ILink } from '../models/Link';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateLinkInput {
  slug: string;
  originalUrl: string;
  userId?: string | Types.ObjectId | null;
  expiresAt?: Date | null;
}

export interface FindByUserOptions {
  page?: number;
  limit?: number;
  /** When false, inactive links are excluded from the result */
  includeInactive?: boolean;
}

export interface PaginatedLinks {
  links: ILink[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

// ── Repository ────────────────────────────────────────────────────────────────

/**
 * Pure data-access layer. No business logic lives here.
 * Methods return plain objects (via .lean()) so the service layer works with
 * simple data structures, not Mongoose Document instances.
 */
export const linkRepository = {
  /**
   * Fetch a link by its slug. Used on every redirect — must hit the
   * { slug: 1 } unique index for O(1) lookup.
   */
  async findBySlug(slug: string): Promise<ILink | null> {
    return Link.findOne({ slug: slug.toLowerCase() }).lean() as Promise<ILink | null>;
  },

  /** Fetch a single link by its MongoDB _id. */
  async findById(id: string | Types.ObjectId): Promise<ILink | null> {
    if (typeof id === 'string' && !Types.ObjectId.isValid(id)) return null;
    return Link.findById(toObjectId(id)).lean() as Promise<ILink | null>;
  },

  /**
   * Paginated list of all links belonging to a user.
   * Sorted newest-first using the { userId, createdAt } compound index.
   */
  async findByUserId(
    userId: string | Types.ObjectId,
    options: FindByUserOptions = {},
  ): Promise<PaginatedLinks> {
    const { page = 1, limit = 20, includeInactive = true } = options;
    const filter: Record<string, unknown> = { userId: toObjectId(userId) };
    if (!includeInactive) filter.isActive = true;

    const [links, total] = await Promise.all([
      Link.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as Promise<ILink[]>,
      Link.countDocuments(filter),
    ]);

    return {
      links,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /** Insert a new link document. */
  async create(input: CreateLinkInput): Promise<ILink> {
    const doc = await Link.create({
      slug: input.slug.toLowerCase(),
      originalUrl: input.originalUrl,
      userId: input.userId ?? null,
      expiresAt: input.expiresAt ?? null,
    });
    return doc.toObject() as ILink;
  },

  /**
   * Atomically increment the denormalized clickCount.
   * Called by the queue worker after each click is processed — must never
   * block the redirect response.
   */
  async incrementClickCount(linkId: string | Types.ObjectId): Promise<void> {
    await Link.findByIdAndUpdate(toObjectId(linkId), { $inc: { clickCount: 1 } });
  },

  /**
   * Soft-delete: mark a link as inactive.
   * Scoped to userId so a user can only deactivate their own links.
   */
  async deactivate(
    linkId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<ILink | null> {
    return Link.findOneAndUpdate(
      { _id: toObjectId(linkId), userId: toObjectId(userId) },
      { isActive: false },
      { new: true },
    ).lean() as Promise<ILink | null>;
  },

  /**
   * Hard delete. Returns true if a document was actually removed.
   * Scoped to userId so users can only delete their own links.
   */
  async deleteById(
    linkId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean> {
    const result = await Link.deleteOne({
      _id: toObjectId(linkId),
      userId: toObjectId(userId),
    });
    return result.deletedCount > 0;
  },

  /** Update the expiry date on a link. Pass null to remove the expiry. */
  async updateExpiry(
    linkId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    expiresAt: Date | null,
  ): Promise<ILink | null> {
    return Link.findOneAndUpdate(
      { _id: toObjectId(linkId), userId: toObjectId(userId) },
      { expiresAt },
      { new: true },
    ).lean() as Promise<ILink | null>;
  },

  /** Check whether a slug string is already taken. */
  async slugExists(slug: string): Promise<boolean> {
    const count = await Link.countDocuments({ slug: slug.toLowerCase() });
    return count > 0;
  },
};
