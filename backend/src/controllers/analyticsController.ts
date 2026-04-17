import { Request, Response } from 'express';
import { linkService } from '../services/linkService';
import { analyticsService } from '../services/analyticsService';
import { asyncHandler } from '../utils/asyncHandler';

export const analyticsController = {
  /**
   * GET /api/links/:id/analytics
   *
   * Returns the full analytics breakdown for a link:
   *   - clicksOverTime: 30-day time series (zero-filled)
   *   - countries: top 20 countries by click count
   *   - devices: mobile / desktop / tablet / unknown breakdown
   *   - browsers: top 10 browsers
   *   - totalClicks: total recorded clicks
   *   - uniqueClicks: distinct IP count (unique visitor proxy)
   *
   * getLinkById throws 404 if the link doesn't exist and 403 if the
   * authenticated user does not own it — ownership is enforced at the
   * service layer, not here.
   */
  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    // Throws 404 / 403 if link not found or not owned by this user
    await linkService.getLinkById(req.params.id, req.user!.userId);

    const analytics = await analyticsService.getFullAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  }),
};
