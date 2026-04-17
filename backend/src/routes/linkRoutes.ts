import { Router } from 'express';
import { linkController } from '../controllers/linkController';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate, optionalAuth } from '../middleware/authenticate';

const router = Router();

// ── Public (optional auth) ────────────────────────────────────────────────────
// Anyone can shorten a URL. If a valid token is provided, the link is
// associated with that user's account.
router.post('/', optionalAuth, linkController.createLink);

// ── Protected (auth required) ─────────────────────────────────────────────────
router.get('/', authenticate, linkController.getUserLinks);
router.patch('/:id/deactivate', authenticate, linkController.deactivateLink);
router.patch('/:id/expiry', authenticate, linkController.updateExpiry);
router.delete('/:id', authenticate, linkController.deleteLink);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/:id/analytics', authenticate, analyticsController.getAnalytics);

export default router;
