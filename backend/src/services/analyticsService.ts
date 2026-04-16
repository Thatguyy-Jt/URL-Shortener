import { Types } from 'mongoose';
import { clickRepository, DayCount } from '../repositories/clickRepository';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate a complete ordered array of YYYY-MM-DD strings for the last `days`
 * days, ending on (and including) `referenceDate`.
 *
 * Array is in chronological order: index 0 = oldest, index (days-1) = today.
 *
 * Using UTC date operations to stay consistent with MongoDB's $dateToString
 * which also defaults to UTC.
 *
 * The `referenceDate` parameter makes this deterministic and unit-testable
 * without mocking the system clock.
 */
function generateDateRange(days: number, referenceDate: Date): string[] {
  const dates: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setUTCDate(d.getUTCDate() - i);

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }

  return dates;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const analyticsService = {
  /**
   * Returns clicks per day for the last `days` days.
   *
   * Zero-fill: the repository only returns days that have at least one click.
   * This method merges that sparse data into a complete 30-point array,
   * inserting count: 0 for any day with no recorded clicks.
   *
   * @param referenceDate - Defaults to now. Pass a fixed value in tests.
   */
  async getClicksOverTime(
    linkId: string | Types.ObjectId,
    days = 30,
    referenceDate = new Date(),
  ): Promise<DayCount[]> {
    const rawData = await clickRepository.aggregateByDay(linkId, days);
    const dataMap = new Map(rawData.map(({ date, count }) => [date, count]));

    return generateDateRange(days, referenceDate).map((date) => ({
      date,
      count: dataMap.get(date) ?? 0,
    }));
  },

  /** Top 20 countries by click count for a specific link. */
  async getCountryBreakdown(linkId: string | Types.ObjectId) {
    return clickRepository.aggregateByCountry(linkId);
  },

  /** Click breakdown by device type (mobile / desktop / tablet / unknown). */
  async getDeviceBreakdown(linkId: string | Types.ObjectId) {
    return clickRepository.aggregateByDevice(linkId);
  },

  /** Top 10 browsers by click count. */
  async getBrowserBreakdown(linkId: string | Types.ObjectId) {
    return clickRepository.aggregateByBrowser(linkId);
  },

  /** Total and unique (distinct IP) click counts for a link. */
  async getLinkStats(linkId: string | Types.ObjectId) {
    const [total, unique] = await Promise.all([
      clickRepository.countTotal(linkId),
      clickRepository.countUnique(linkId),
    ]);
    return { total, unique };
  },

  /**
   * Fetch all analytics breakdowns for a link in a single call.
   * All repository queries run in parallel via Promise.all.
   * Used by the analytics API endpoint (wired up in Phase 4).
   */
  async getFullAnalytics(linkId: string | Types.ObjectId) {
    const [clicksOverTime, countries, devices, browsers, stats] = await Promise.all([
      this.getClicksOverTime(linkId),
      this.getCountryBreakdown(linkId),
      this.getDeviceBreakdown(linkId),
      this.getBrowserBreakdown(linkId),
      this.getLinkStats(linkId),
    ]);

    return {
      clicksOverTime,
      countries,
      devices,
      browsers,
      totalClicks: stats.total,
      uniqueClicks: stats.unique,
    };
  },
};
