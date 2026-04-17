import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100).trim(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Controllers ───────────────────────────────────────────────────────────────

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(
        `Validation failed: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
        400,
      );
    }

    const { token, user } = await authService.register(result.data);
    res.status(201).json({ success: true, data: { token, user } });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError('Invalid email or password', 400);
    }

    const { token, user } = await authService.login(result.data);
    res.status(200).json({ success: true, data: { token, user } });
  }),

  /** Returns the authenticated user's profile — no body needed, user comes from the JWT. */
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.userId);
    res.status(200).json({ success: true, data: { user } });
  }),
};
