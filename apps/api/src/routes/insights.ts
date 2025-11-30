import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCachedInsights, generateInsightsForUser } from '../services/insights.service.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/insights
 * Get cached insights for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const insights = await getCachedInsights(req.user!.id);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights',
    });
  }
});

/**
 * POST /api/insights/regenerate
 * Force regenerate insights for the authenticated user
 */
router.post('/regenerate', async (req, res) => {
  try {
    await generateInsightsForUser(req.user!.id);
    const insights = await getCachedInsights(req.user!.id);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error regenerating insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate insights',
    });
  }
});

export default router;
