import mongoose, { Schema, Types } from 'mongoose';

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

export interface IClick {
  _id: Types.ObjectId;
  linkId: Types.ObjectId;
  /**
   * Explicit timestamp field (instead of Mongoose's auto createdAt) so we can
   * control the value precisely — useful for back-dating clicks recorded via
   * the async queue where there is a small lag between the redirect and the
   * queue worker writing to the DB.
   */
  timestamp: Date;
  ip: string;
  country: string;
  city: string;
  device: DeviceType;
  browser: string;
  referrer: string | null;
}

const clickSchema = new Schema<IClick>(
  {
    linkId: {
      type: Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
    ip: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    city: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    device: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'] satisfies DeviceType[],
      default: 'unknown' as DeviceType,
    },
    browser: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    referrer: {
      type: String,
      default: null,
    },
  },
  {
    collection: 'clicks',
    // No `timestamps: true` — we own the `timestamp` field directly
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * CRITICAL compound index — required by the PRD.
 *
 * All analytics aggregation pipelines start with:
 *   { $match: { linkId: X, timestamp: { $gte: startDate } } }
 * followed by a sort on timestamp.
 *
 * Without this index, every analytics query is a full collection scan.
 * With it, MongoDB can seek directly to the linkId bucket and walk the
 * timestamps in order — O(log n) rather than O(n).
 *
 * Phase 6 will run explain() on a live aggregation to confirm IXSCAN usage.
 */
clickSchema.index({ linkId: 1, timestamp: -1 });

/**
 * Secondary index for geo-aggregation queries that group ALL clicks by country
 * (not filtered by a specific linkId first — e.g. platform-wide stats).
 * Also helps the { $match: { country: X } } stage in country-specific queries.
 */
clickSchema.index({ country: 1 });

export const Click = mongoose.model<IClick>('Click', clickSchema);
