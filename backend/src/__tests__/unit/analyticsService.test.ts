/**
 * analyticsService.test.ts  — written BEFORE the implementation (TDD)
 *
 * Key challenge being tested: zero-fill logic.
 * The repository only returns days that HAVE data. The service must produce
 * a complete, gap-free array covering every day in the requested range,
 * inserting count: 0 for days with no clicks.
 *
 * A fixed REFERENCE_DATE is injected to make tests deterministic —
 * no dependency on the current wall-clock date.
 */

import { analyticsService } from '../../services/analyticsService';
import { clickRepository } from '../../repositories/clickRepository';

jest.mock('../../repositories/clickRepository');

const mockClickRepo = jest.mocked(clickRepository);

// Fixed reference point: April 16, 2026 at noon UTC
const REFERENCE_DATE = new Date('2026-04-16T12:00:00.000Z');
const LINK_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';

// ── getClicksOverTime ─────────────────────────────────────────────────────────

describe('analyticsService.getClicksOverTime', () => {
  it('returns exactly 30 data points by default', async () => {
    mockClickRepo.aggregateByDay.mockResolvedValue([]);

    const result = await analyticsService.getClicksOverTime(LINK_ID, 30, REFERENCE_DATE);

    expect(result).toHaveLength(30);
  });

  it('returns the correct number of points for a custom day range', async () => {
    mockClickRepo.aggregateByDay.mockResolvedValue([]);

    const result = await analyticsService.getClicksOverTime(LINK_ID, 7, REFERENCE_DATE);

    expect(result).toHaveLength(7);
  });

  it('fills count: 0 for every day the repository has no data for', async () => {
    // Repository returns only 2 of the 30 days
    mockClickRepo.aggregateByDay.mockResolvedValue([
      { date: '2026-04-15', count: 5 },
      { date: '2026-04-16', count: 3 },
    ]);

    const result = await analyticsService.getClicksOverTime(LINK_ID, 30, REFERENCE_DATE);

    expect(result).toHaveLength(30);

    const zeroDays = result.filter((d) => d.count === 0);
    expect(zeroDays).toHaveLength(28); // 30 total − 2 days with data
  });

  it('maps repository click counts to the correct date slots', async () => {
    mockClickRepo.aggregateByDay.mockResolvedValue([
      { date: '2026-04-15', count: 7 },
      { date: '2026-04-16', count: 2 },
    ]);

    const result = await analyticsService.getClicksOverTime(LINK_ID, 30, REFERENCE_DATE);

    // With referenceDate = April 16:
    //   result[29] = April 16 (today, i=0)
    //   result[28] = April 15 (yesterday, i=1)
    expect(result[29]).toEqual({ date: '2026-04-16', count: 2 });
    expect(result[28]).toEqual({ date: '2026-04-15', count: 7 });
  });

  it('returns data points in chronological order (oldest first)', async () => {
    mockClickRepo.aggregateByDay.mockResolvedValue([]);

    const result = await analyticsService.getClicksOverTime(LINK_ID, 30, REFERENCE_DATE);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].date > result[i - 1].date).toBe(true);
    }
  });

  it('starts 29 days before the reference date and ends on the reference date', async () => {
    mockClickRepo.aggregateByDay.mockResolvedValue([]);

    const result = await analyticsService.getClicksOverTime(LINK_ID, 30, REFERENCE_DATE);

    // April 16 − 29 days = March 18, 2026
    expect(result[0].date).toBe('2026-03-18');
    expect(result[29].date).toBe('2026-04-16');
  });

  it('returns count: 0 for all days when the repository returns empty array', async () => {
    mockClickRepo.aggregateByDay.mockResolvedValue([]);

    const result = await analyticsService.getClicksOverTime(LINK_ID, 30, REFERENCE_DATE);

    expect(result.every((d) => d.count === 0)).toBe(true);
  });
});

// ── getFullAnalytics ──────────────────────────────────────────────────────────

describe('analyticsService.getFullAnalytics', () => {
  it('combines all breakdown data into a single object', async () => {
    mockClickRepo.aggregateByDay.mockResolvedValue([]);
    mockClickRepo.aggregateByCountry.mockResolvedValue([{ country: 'Nigeria', count: 10 }]);
    mockClickRepo.aggregateByDevice.mockResolvedValue([{ device: 'mobile', count: 8 }]);
    mockClickRepo.aggregateByBrowser.mockResolvedValue([{ browser: 'Chrome', count: 6 }]);
    mockClickRepo.countTotal.mockResolvedValue(10);
    mockClickRepo.countUnique.mockResolvedValue(7);

    const result = await analyticsService.getFullAnalytics(LINK_ID);

    expect(result).toMatchObject({
      clicksOverTime: expect.any(Array),
      countries: [{ country: 'Nigeria', count: 10 }],
      devices: [{ device: 'mobile', count: 8 }],
      browsers: [{ browser: 'Chrome', count: 6 }],
      totalClicks: 10,
      uniqueClicks: 7,
    });
  });

  it('fires all repository calls in parallel (all mocks called exactly once)', async () => {
    mockClickRepo.aggregateByDay.mockResolvedValue([]);
    mockClickRepo.aggregateByCountry.mockResolvedValue([]);
    mockClickRepo.aggregateByDevice.mockResolvedValue([]);
    mockClickRepo.aggregateByBrowser.mockResolvedValue([]);
    mockClickRepo.countTotal.mockResolvedValue(0);
    mockClickRepo.countUnique.mockResolvedValue(0);

    await analyticsService.getFullAnalytics(LINK_ID);

    expect(mockClickRepo.aggregateByDay).toHaveBeenCalledTimes(1);
    expect(mockClickRepo.aggregateByCountry).toHaveBeenCalledTimes(1);
    expect(mockClickRepo.aggregateByDevice).toHaveBeenCalledTimes(1);
    expect(mockClickRepo.aggregateByBrowser).toHaveBeenCalledTimes(1);
    expect(mockClickRepo.countTotal).toHaveBeenCalledTimes(1);
    expect(mockClickRepo.countUnique).toHaveBeenCalledTimes(1);
  });
});
