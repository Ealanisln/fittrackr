import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../lib/auth';

const router = Router();

// Better Auth handles all auth routes automatically
// Convert Express handler to Node.js compatible handler
router.all('*', toNodeHandler(auth));

export default router;
