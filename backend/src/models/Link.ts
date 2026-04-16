import mongoose, { Schema, Types } from 'mongoose';

export interface ILink {
  _id: Types.ObjectId;
  slug: string;
  originalUrl: string;
  /**
   * null for anonymous (unauthenticated) links.
   * Indexed as part of the compound { userId, createdAt } index.
   */
  userId: Types.ObjectId | null;
  isActive: boolean;
  expiresAt: Date | null;
  /**
   * Denormalized click count — incremented atomically on every click so the
   * dashboard can display totals without querying the Click collection.
   */
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const linkSchema = new Schema<ILink>(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'links',
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * Primary lookup — redirect by slug.
 * Every redirect hits this index. Must be unique and O(1).
 * Declared unique here; the `unique: true` option in the field schema would
 * also work, but explicit index declaration is clearer for documentation.
 */
linkSchema.index({ slug: 1 }, { unique: true });

/**
 * Dashboard query — "show all links for this user, most recent first".
 * The compound index covers both the userId equality filter AND the
 * createdAt descending sort in a single index scan.
 */
linkSchema.index({ userId: 1, createdAt: -1 });

export const Link = mongoose.model<ILink>('Link', linkSchema);
