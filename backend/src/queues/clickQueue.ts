import Bull from 'bull';
import UAParser from 'ua-parser-js';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { clickRepository } from '../repositories/clickRepository';
import { linkRepository } from '../repositories/linkRepository';
import { getGeoFromIp } from '../services/geoService';
import type { DeviceType } from '../models/Click';

// ── Job payload ───────────────────────────────────────────────────────────────

export interface ClickJobData {
  linkId: string;
  ip: string;
  userAgent: string;
  referrer: string | null;
  /** ISO string — Bull serialises job data as JSON, so Date objects become strings */
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDeviceType(type: string | undefined): DeviceType {
  if (!type) return 'desktop'; // No device type in the UA string = desktop browser
  if (type === 'mobile') return 'mobile';
  if (type === 'tablet') return 'tablet';
  return 'unknown';
}

// ── Queue ─────────────────────────────────────────────────────────────────────

export const clickQueue = new Bull<ClickJobData>('click-recording', env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100, // Keep last 100 completed jobs for debugging
    removeOnFail: 50,
  },
});

/**
 * Queue processor — runs for each click job dequeued from Redis.
 *
 * Runs with concurrency of 5: up to 5 click jobs are processed in parallel.
 * Responsibilities:
 *  1. Parse the User-Agent string into device type + browser name
 *  2. Resolve the IP to country/city (fails silently via geoService)
 *  3. Write the Click document to MongoDB
 *  4. Increment the denormalized Link.clickCount counter
 *
 * This is intentionally decoupled from the redirect path — the HTTP
 * response is sent before this worker even starts.
 */
clickQueue.process(5, async (job) => {
  const { linkId, ip, userAgent, referrer, timestamp } = job.data;

  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();

  const device = parseDeviceType(uaResult.device.type);
  const browser = uaResult.browser.name ?? 'Unknown';

  // geoService never throws — returns { country: 'Unknown' } on any error
  const geo = await getGeoFromIp(ip);

  await clickRepository.insert({
    linkId,
    ip,
    country: geo.country,
    city: geo.city,
    device,
    browser,
    referrer,
    timestamp: new Date(timestamp),
  });

  // Atomic increment of the denormalized counter on the Link document
  await linkRepository.incrementClickCount(linkId);

  logger.debug(
    { event: 'click_recorded', linkId, country: geo.country, device, browser },
    'Click recorded successfully',
  );
});

clickQueue.on('failed', (job, err) => {
  logger.error(
    { event: 'click_job_failed', jobId: job.id, linkId: job.data.linkId, err },
    'Click queue job failed after all retries',
  );
});

clickQueue.on('error', (err) => {
  logger.error({ event: 'click_queue_error', err }, 'Click queue connection error');
});
