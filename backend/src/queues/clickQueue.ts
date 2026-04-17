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

// ── Shared processor logic ────────────────────────────────────────────────────

function parseDeviceType(type: string | undefined): DeviceType {
  if (!type) return 'desktop';
  if (type === 'mobile') return 'mobile';
  if (type === 'tablet') return 'tablet';
  return 'unknown';
}

async function processClick(data: ClickJobData): Promise<void> {
  const { linkId, ip, userAgent, referrer, timestamp } = data;

  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();

  const device = parseDeviceType(uaResult.device.type);
  const browser = uaResult.browser.name ?? 'Unknown';

  // geoService never throws — returns { country: 'Unknown' } on any error
  const geo = await getGeoFromIp(ip);

  await clickRepository.insert({
    linkId, ip,
    country: geo.country,
    city: geo.city,
    device, browser, referrer,
    timestamp: new Date(timestamp),
  });

  await linkRepository.incrementClickCount(linkId);

  logger.debug(
    { event: 'click_recorded', linkId, country: geo.country, device, browser },
    'Click recorded successfully',
  );
}

// ── Redis-optional Bull queue ─────────────────────────────────────────────────

/**
 * `queueHealthy` is `true` only when Redis has confirmed it is ready.
 * It flips back to `false` any time a connection error fires so we fall
 * back to direct writes automatically while Redis is down.
 */
let queueHealthy = false;

const queue = new Bull<ClickJobData>('click-recording', env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

queue.on('ready', () => {
  queueHealthy = true;
  logger.info({ event: 'click_queue_ready' }, 'Click queue connected to Redis');
});

queue.on('error', (err) => {
  queueHealthy = false;
  // Log as WARN — Redis is optional; the server continues via direct writes.
  logger.warn(
    { event: 'click_queue_unavailable', code: (err as NodeJS.ErrnoException).code },
    'Redis unavailable — clicks will be written directly to MongoDB',
  );
});

queue.process(5, async (job) => {
  await processClick(job.data);
});

queue.on('failed', (job, err) => {
  logger.error(
    { event: 'click_job_failed', jobId: job.id, linkId: job.data.linkId, err },
    'Click queue job failed after all retries',
  );
});

// Bull creates two internal ioredis clients (client + eclient/subscriber).
// If those clients emit 'error' events that are not separately handled,
// Node.js promotes them to uncaughtException / unhandledRejection.
// Attach silent error handlers after a tick (clients are created lazily).
setImmediate(() => {
  const q = queue as unknown as Record<string, { on?: Function }>;
  const noop = () => undefined;
  if (q['client']?.on)  q['client'].on('error', noop);
  if (q['eclient']?.on) q['eclient'].on('error', noop);
});

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a click — fire-and-forget, never throws.
 *
 * • Redis healthy  → adds a job to the Bull queue (fast, decoupled from redirect)
 * • Redis down     → processes the click inline (slightly slower but never lost)
 */
export function recordClick(data: ClickJobData): void {
  if (queueHealthy) {
    queue.add(data).catch((err) => {
      logger.warn({ event: 'click_queue_add_failed', err }, 'Queue add failed — falling back to direct write');
      processClick(data).catch((e) =>
        logger.error({ event: 'click_direct_write_failed', e }, 'Direct click write also failed'),
      );
    });
    return;
  }

  // Direct-write path (Redis is down or not yet confirmed ready)
  processClick(data).catch((err) => {
    logger.error({ event: 'click_direct_write_failed', err }, 'Click write failed');
  });
}
