import { Router } from 'express';
import { redirectController } from '../controllers/redirectController';

const router = Router();

// This route must be mounted LAST in app.ts so it doesn't shadow /api/* routes
router.get('/:slug', redirectController.redirect);

export default router;
