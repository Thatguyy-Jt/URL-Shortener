import { Types } from 'mongoose';
import { Click, IClick, DeviceType } from '../models/Click';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateClickInput {
  linkId: string | Types.ObjectId;
  ip: string;
  country?: string;
  city?: string;
  device?: DeviceType;
  browser?: string;
  referrer?: string | null;
  /** Defaults to now. Pass an explicit value from the queue worker so the
   *  timestamp reflects when the redirect happened, not when it was processed. */
  timestamp?: Date;
}

// ── Aggregation result shapes ─────────────────────────────────────────────────

export interface DayCount {
  /** ISO date string: 'YYYY-MM-DD' */
  date: string;
  count: number;
}

export interface CountryCount {
  country: string;
  count: number;
}

export interface DeviceCount {
  device: string;
  count: number;
}

export interface BrowserCount {
  browser: string;
  count: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

// ── Repository ────────────────────────────────────────────────────────────────

export const clickRepository = {
  /** Insert a single click record. */
  async insert(input: CreateClickInput): Promise<IClick> {
    const doc = await Click.create({
      linkId: toObjectId(input.linkId),
      ip: input.ip,
      country: input.country ?? 'Unknown',
      city: input.city ?? 'Unknown',
      device: input.device ?? 'unknown',
      browser: input.browser ?? 'Unknown',
      referrer: input.referrer ?? null,
      timestamp: input.timestamp ?? new Date(),
    });
    return doc.toObject() as IClick;
  },

  /**
   * Bulk-insert multiple clicks in a single round-trip.
   * Used by the Bull queue worker which may batch several clicks together
   * before flushing them to the database.
   */
  async batchInsert(inputs: CreateClickInput[]): Promise<void> {
    const docs = inputs.map((input) => ({
      linkId: toObjectId(input.linkId),
      ip: input.ip,
      country: input.country ?? 'Unknown',
      city: input.city ?? 'Unknown',
      device: input.device ?? 'unknown',
      browser: input.browser ?? 'Unknown',
      referrer: input.referrer ?? null,
      timestamp: input.timestamp ?? new Date(),
    }));
    await Click.insertMany(docs, { ordered: false });
  },

  /**
   * Clicks grouped by calendar day for the last `days` days.
   *
   * Uses the compound { linkId, timestamp } index:
   *   $match narrows to a specific linkId + date range  →  index scan
   *   $group + $dateToString bucket by YYYY-MM-DD
   *
   * NOTE: This returns ONLY days that have at least one click.
   * Zero-filling (inserting 0-count days) is done in analyticsService so the
   * DB layer stays free of presentation concerns.
   */
  async aggregateByDay(
    linkId: string | Types.ObjectId,
    days = 30,
  ): Promise<DayCount[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    return Click.aggregate<DayCount>([
      {
        $match: {
          linkId: toObjectId(linkId),
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, date: '$_id', count: 1 } },
      { $sort: { date: 1 } },
    ]);
  },

  /**
   * Clicks grouped by country, sorted by count descending.
   * Capped at 20 countries to keep the payload small.
   *
   * Uses the compound { linkId, timestamp } index for the $match stage,
   * then the { country } index assists the $group stage.
   */
  async aggregateByCountry(
    linkId: string | Types.ObjectId,
  ): Promise<CountryCount[]> {
    return Click.aggregate<CountryCount>([
      { $match: { linkId: toObjectId(linkId) } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $project: { _id: 0, country: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
  },

  /** Clicks grouped by device type (mobile / desktop / tablet / unknown). */
  async aggregateByDevice(
    linkId: string | Types.ObjectId,
  ): Promise<DeviceCount[]> {
    return Click.aggregate<DeviceCount>([
      { $match: { linkId: toObjectId(linkId) } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $project: { _id: 0, device: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
  },

  /** Clicks grouped by browser (Chrome, Firefox, Safari, etc.). */
  async aggregateByBrowser(
    linkId: string | Types.ObjectId,
  ): Promise<BrowserCount[]> {
    return Click.aggregate<BrowserCount>([
      { $match: { linkId: toObjectId(linkId) } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $project: { _id: 0, browser: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
  },

  /** Total click count for a link (mirrors the denormalized Link.clickCount). */
  async countTotal(linkId: string | Types.ObjectId): Promise<number> {
    return Click.countDocuments({ linkId: toObjectId(linkId) });
  },

  /**
   * Count of distinct IP addresses — used as a proxy for unique visitors.
   * .distinct() returns an array of unique values; .length gives the count.
   * For large link volumes (>100k clicks) consider switching to an
   * approximation ($approxCountDistinct in Atlas) to avoid memory pressure.
   */
  async countUnique(linkId: string | Types.ObjectId): Promise<number> {
    const ips = await Click.distinct('ip', { linkId: toObjectId(linkId) });
    return ips.length;
  },
};
