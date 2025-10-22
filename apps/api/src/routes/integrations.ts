import { Router } from 'express';
import { prisma } from '@fittrack/database';
import { requireAuth } from '../middleware/auth';
import {
  getStravaAuthUrl,
  exchangeStravaCode,
  importStravaActivities,
} from '../services/strava.service';

const router = Router();

// Apply authentication to all integration routes
router.use(requireAuth);

// ============================================
// Strava Integration Routes
// ============================================

// GET /api/integrations/strava/auth - Get Strava OAuth URL
router.get('/strava/auth', async (req, res) => {
  try {
    const authUrl = getStravaAuthUrl(req.user!.id);

    res.json({
      success: true,
      data: {
        authUrl,
      },
    });
  } catch (error) {
    console.error('Error generating Strava auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL',
    });
  }
});

// GET /api/integrations/strava/callback - OAuth callback
router.get('/strava/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Authorization code missing',
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID missing',
      });
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeStravaCode(code);

    // Store integration in database
    await prisma.integration.upsert({
      where: {
        userId_type: {
          userId,
          type: 'STRAVA',
        },
      },
      create: {
        userId,
        type: 'STRAVA',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(tokenResponse.expires_at * 1000),
        isActive: true,
        metadata: {
          athleteId: tokenResponse.athlete.id,
          username: tokenResponse.athlete.username,
          firstname: tokenResponse.athlete.firstname,
          lastname: tokenResponse.athlete.lastname,
        },
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(tokenResponse.expires_at * 1000),
        isActive: true,
        metadata: {
          athleteId: tokenResponse.athlete.id,
          username: tokenResponse.athlete.username,
          firstname: tokenResponse.athlete.firstname,
          lastname: tokenResponse.athlete.lastname,
        },
      },
    });

    console.log(`✅ Strava connected for user ${userId}`);

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/integrations?strava=connected`);
  } catch (error) {
    console.error('Error in Strava callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/integrations?strava=error`);
  }
});

// POST /api/integrations/strava/sync - Import activities from Strava
router.post('/strava/sync', async (req, res) => {
  try {
    const { after, limit } = req.body;

    const result = await importStravaActivities(req.user!.id, {
      after: after ? new Date(after) : undefined,
      limit: limit || 50,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error syncing Strava activities:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync activities',
    });
  }
});

// DELETE /api/integrations/strava - Disconnect Strava
router.delete('/strava', async (req, res) => {
  try {
    await prisma.integration.deleteMany({
      where: {
        userId: req.user!.id,
        type: 'STRAVA',
      },
    });

    res.json({
      success: true,
      message: 'Strava integration disconnected',
    });
  } catch (error) {
    console.error('Error disconnecting Strava:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Strava',
    });
  }
});

// ============================================
// General Integration Routes
// ============================================

// GET /api/integrations - Get all user integrations
router.get('/', async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: {
        userId: req.user!.id,
      },
      select: {
        id: true,
        type: true,
        isActive: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch integrations',
    });
  }
});

export default router;
