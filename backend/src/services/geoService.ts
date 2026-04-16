import { env } from '../config/env';
import { logger } from '../config/logger';

export interface GeoResult {
  country: string;
  countryCode: string;
  city: string;
}

const UNKNOWN: GeoResult = {
  country: 'Unknown',
  countryCode: 'XX',
  city: 'Unknown',
};

/**
 * Returns true for private/loopback addresses that cannot be geolocated.
 * These are common in local development (localhost, Docker networks, etc.).
 */
function isPrivateOrLocal(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)
  );
}

/**
 * Resolve an IP address to its country and city via ipapi.co.
 *
 * Design principles:
 *  - Fails silently: any error returns UNKNOWN rather than crashing the caller.
 *    Geo is informational — it must NEVER block or slow a redirect.
 *  - 3-second timeout via AbortSignal.timeout() — well within redirect budget.
 *  - Private/loopback IPs skip the network call entirely.
 *  - Rate limits: ipapi.co free tier = 1,000 req/day without a key,
 *    30,000/month with IPAPI_KEY. Set IPAPI_KEY in .env for production.
 */
export async function getGeoFromIp(ip: string): Promise<GeoResult> {
  if (isPrivateOrLocal(ip)) {
    return UNKNOWN;
  }

  try {
    const baseUrl = `https://ipapi.co/${ip}/json/`;
    const url = env.IPAPI_KEY ? `${baseUrl}?key=${env.IPAPI_KEY}` : baseUrl;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'url-shortener/1.0' },
      // Never let a slow geo API hold up the click queue worker
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      logger.warn(
        { event: 'geo_lookup_non_200', ip, status: response.status },
        'ipapi.co returned a non-200 status',
      );
      return UNKNOWN;
    }

    const data = (await response.json()) as Record<string, unknown>;

    // ipapi.co includes an `error: true` field when it cannot resolve the IP
    if (data.error) {
      return UNKNOWN;
    }

    return {
      country: (data.country_name as string) ?? 'Unknown',
      countryCode: (data.country_code as string) ?? 'XX',
      city: (data.city as string) ?? 'Unknown',
    };
  } catch (err) {
    logger.warn(
      { event: 'geo_lookup_error', ip, err },
      'Geo lookup failed — falling back to Unknown',
    );
    return UNKNOWN;
  }
}
