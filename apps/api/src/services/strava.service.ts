import axios from 'axios';
import { prisma } from '@fittrack/database';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
}

/**
 * Generate the Strava OAuth authorization URL
 */
export function getStravaAuthUrl(userId: string): string {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI || 'http://localhost:3001/api/integrations/strava/callback';

  if (!clientId) {
    throw new Error('STRAVA_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'activity:read_all',
    state: userId, // Pass userId to link the integration
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava credentials not configured');
  }

  const response = await axios.post<StravaTokenResponse>(STRAVA_TOKEN_URL, {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
  });

  return response.data;
}

/**
 * Refresh an expired access token
 */
export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava credentials not configured');
  }

  const response = await axios.post<StravaTokenResponse>(STRAVA_TOKEN_URL, {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  return response.data;
}

/**
 * Get a valid access token, refreshing if necessary
 */
async function getValidAccessToken(userId: string): Promise<string> {
  const integration = await prisma.integration.findUnique({
    where: {
      userId_type: {
        userId,
        type: 'STRAVA',
      },
    },
  });

  if (!integration || !integration.isActive) {
    throw new Error('Strava integration not found or inactive');
  }

  // Check if token is expired (tokens expire after 6 hours)
  const now = new Date();
  if (integration.expiresAt && integration.expiresAt <= now) {
    console.log('🔄 Strava token expired, refreshing...');

    const tokenResponse = await refreshStravaToken(integration.refreshToken!);

    // Update integration with new tokens
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(tokenResponse.expires_at * 1000),
      },
    });

    return tokenResponse.access_token;
  }

  return integration.accessToken;
}

/**
 * Fetch activities from Strava API
 */
export async function fetchStravaActivities(
  userId: string,
  options: {
    after?: Date;
    before?: Date;
    page?: number;
    perPage?: number;
  } = {}
): Promise<StravaActivity[]> {
  const accessToken = await getValidAccessToken(userId);

  const params: any = {
    page: options.page || 1,
    per_page: options.perPage || 30,
  };

  if (options.after) {
    params.after = Math.floor(options.after.getTime() / 1000);
  }

  if (options.before) {
    params.before = Math.floor(options.before.getTime() / 1000);
  }

  const response = await axios.get<StravaActivity[]>(
    `${STRAVA_API_BASE}/athlete/activities`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    }
  );

  return response.data;
}

/**
 * Convert Strava activity to FitTrack workout format
 */
export function convertStravaActivityToWorkout(activity: StravaActivity, userId: string) {
  // Convert meters to km
  const distanceKm = activity.distance / 1000;

  // Convert m/s to min/km pace
  const avgPaceMinPerKm = activity.average_speed > 0
    ? (1000 / 60) / activity.average_speed
    : 0;
  const paceMinutes = Math.floor(avgPaceMinPerKm);
  const paceSeconds = Math.floor((avgPaceMinPerKm - paceMinutes) * 60);
  const avgPace = `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}"/km`;

  // Convert seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Estimate effort level based on pace and heart rate
  let effortLevel = 5; // Default: Moderate
  let effortDescription = 'Moderate';

  if (activity.average_heartrate) {
    if (activity.average_heartrate < 120) {
      effortLevel = 3;
      effortDescription = 'Easy';
    } else if (activity.average_heartrate < 150) {
      effortLevel = 5;
      effortDescription = 'Moderate';
    } else {
      effortLevel = 8;
      effortDescription = 'Hard';
    }
  }

  return {
    userId,
    date: new Date(activity.start_date_local),
    workoutType: activity.sport_type || activity.type,
    workoutTime: formatTime(activity.moving_time),
    elapsedTime: formatTime(activity.elapsed_time),
    distanceKm,
    activeKcal: 0, // Strava doesn't provide calories
    totalKcal: 0,
    elevationGainM: Math.round(activity.total_elevation_gain),
    avgPace,
    avgHeartRateBpm: Math.round(activity.average_heartrate || 0),
    effortLevel,
    effortDescription,
    source: 'STRAVA' as const,
    sourceMetadata: {
      stravaId: activity.id,
      name: activity.name,
      avgSpeed: activity.average_speed,
      maxSpeed: activity.max_speed,
      maxHeartrate: activity.max_heartrate,
    },
  };
}

/**
 * Import Strava activities and create workouts
 */
export async function importStravaActivities(
  userId: string,
  options: {
    after?: Date;
    limit?: number;
  } = {}
): Promise<{ imported: number; skipped: number }> {
  console.log(`📥 Importing Strava activities for user ${userId}`);

  let imported = 0;
  let skipped = 0;
  let page = 1;
  const perPage = 30;
  const limit = options.limit || 100;

  while (imported + skipped < limit) {
    const activities = await fetchStravaActivities(userId, {
      after: options.after,
      page,
      perPage,
    });

    if (activities.length === 0) {
      break; // No more activities
    }

    for (const activity of activities) {
      if (imported + skipped >= limit) break;

      // Check if activity already imported
      const existing = await prisma.workout.findFirst({
        where: {
          userId,
          source: 'STRAVA',
          sourceMetadata: {
            path: ['stravaId'],
            equals: activity.id,
          },
        },
      });

      if (existing) {
        console.log(`⏭️  Skipping existing activity: ${activity.name} (${activity.id})`);
        skipped++;
        continue;
      }

      // Convert and create workout
      const workoutData = convertStravaActivityToWorkout(activity, userId);

      await prisma.workout.create({
        data: workoutData,
      });

      console.log(`✅ Imported: ${activity.name} (${activity.id})`);
      imported++;
    }

    page++;
  }

  console.log(`📊 Import complete: ${imported} imported, ${skipped} skipped`);
  return { imported, skipped };
}
