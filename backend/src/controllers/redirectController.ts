import { Request, Response } from 'express';
import { linkService } from '../services/linkService';
import { recordClick } from '../queues/clickQueue';
import { asyncHandler } from '../utils/asyncHandler';

export const redirectController = {
  /**
   * GET /:slug
   *
   * PRD requirements satisfied here:
   *  1. Responds in <100ms  — click recording is fire-and-forget
   *  2. Records the click   — via Bull queue when Redis is up, direct write otherwise
   *  3. 301 redirect        — tells browsers/bots to cache the destination
   */
  redirect: asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const link = await linkService.findActiveLink(slug);

    if (!link) {
      res.status(404).json({
        success: false,
        error: { message: 'Link not found or has expired' },
      });
      return;
    }

    // Fire-and-forget — do NOT await (PRD requirement: <100ms response)
    recordClick({
      linkId: link._id.toString(),
      ip: req.ip ?? '0.0.0.0',
      userAgent: req.headers['user-agent'] ?? '',
      referrer: (req.headers.referer as string) ?? null,
      timestamp: new Date().toISOString(),
    });

    res.redirect(301, link.originalUrl);
  }),
};
