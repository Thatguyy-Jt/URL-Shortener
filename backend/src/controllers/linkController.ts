import { Request, Response } from 'express';
import { z } from 'zod';
import { linkService } from '../services/linkService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

// ── Validation schemas ────────────────────────────────────────────────────────

const createLinkSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  customSlug: z
    .string()
    .min(3, 'Custom slug must be at least 3 characters')
    .max(50, 'Custom slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/i, 'Slug may only contain letters, numbers, and hyphens')
    .optional(),
  expiresAt: z.string().datetime({ message: 'expiresAt must be an ISO 8601 datetime' }).optional(),
});

const updateExpirySchema = z.object({
  expiresAt: z
    .string()
    .datetime({ message: 'expiresAt must be an ISO 8601 datetime' })
    .nullable(),
});

// ── Controllers ───────────────────────────────────────────────────────────────

export const linkController = {
  /**
   * POST /api/links
   * Public endpoint — anyone can shorten a URL.
   * If the user is authenticated (optionalAuth middleware), the link is
   * associated with their account and appears in their dashboard.
   */
  createLink: asyncHandler(async (req: Request, res: Response) => {
    const result = createLinkSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(
        `Validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
        400,
      );
    }

    const link = await linkService.createLink({
      originalUrl: result.data.url,
      userId: req.user?.userId,
      expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : undefined,
      customSlug: result.data.customSlug,
    });

    res.status(201).json({ success: true, data: link });
  }),

  /** GET /api/links — paginated list of the authenticated user's links */
  getUserLinks: asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const result = await linkService.getUserLinks(req.user!.userId, { page, limit });
    res.json({ success: true, data: result });
  }),

  /** PATCH /api/links/:id/deactivate — soft-delete (isActive = false) */
  deactivateLink: asyncHandler(async (req: Request, res: Response) => {
    const link = await linkService.deactivateLink(req.params.id, req.user!.userId);
    res.json({ success: true, data: link });
  }),

  /** DELETE /api/links/:id — hard delete */
  deleteLink: asyncHandler(async (req: Request, res: Response) => {
    await linkService.deleteLink(req.params.id, req.user!.userId);
    res.status(204).send();
  }),

  /** PATCH /api/links/:id/expiry — set or clear the link's expiry date */
  updateExpiry: asyncHandler(async (req: Request, res: Response) => {
    const result = updateExpirySchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(
        `Validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
        400,
      );
    }

    const expiresAt = result.data.expiresAt ? new Date(result.data.expiresAt) : null;
    const link = await linkService.updateLinkExpiry(req.params.id, req.user!.userId, expiresAt);
    res.json({ success: true, data: link });
  }),
};
