import { Request, Response } from 'express';
import { linkService } from '../services/linkService';
import { clickQueue } from '../queues/clickQueue';
import { asyncHandler } from '../utils/asyncHandler';

export const redirectController = {
  /**
   * GET /:slug
   *
   * PRD requirements satisfied here:
   *  1. Responds in <100ms  — click recording is async (fire-and-forget)
   *  2. Records the click   — pushed to Bull queue, never awaited
   *  3. 301 redirect        — tells browsers/bots to cache the destination
   *
   * The clickQueue.add() call is intentionally NOT awaited. The HTTP
   * response is sent immediately after the DB lookup; the queue worker
   * processes the click asynchronously in the background.
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

    // Fire-and-forget — do NOT await (PRD requirement)
    void clickQueue.add({
      linkId: link._id.toString(),
      ip: req.ip ?? '0.0.0.0',
      userAgent: req.headers['user-agent'] ?? '',
      referrer: (req.headers.referer as string) ?? null,
      timestamp: new Date().toISOString(),
    });

    res.redirect(301, link.originalUrl);
  }),
};
