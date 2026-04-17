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
// More specific paths must come before the generic /:id route
router.patch('/:id/deactivate', authenticate, linkController.deactivateLink);
router.patch('/:id/expiry', authenticate, linkController.updateExpiry);
router.get('/:id/analytics', authenticate, analyticsController.getAnalytics);
router.get('/:id', authenticate, linkController.getLink);
router.delete('/:id', authenticate, linkController.deleteLink);

export default router;
