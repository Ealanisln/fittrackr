import GPX from 'gpx-parser-builder';
import { prisma } from '@fittrack/database';

interface GPXTrackPoint {
  $: {
    lat: string;
    lon: string;
  };
  ele?: [string];
  time?: [string];
  extensions?: any;
}

interface GPXTrack {
  trkseg?: Array<{
    trkpt: GPXTrackPoint[];
  }>;
}

/**
 * Parse a GPX file and extract workout data
 */
export async function parseGPXFile(gpxContent: string, userId: string) {
  try {
    // Parse the GPX string
    const gpx = GPX.parse(gpxContent);

    if (!gpx.trk || gpx.trk.length === 0) {
      throw new Error('No track data found in GPX file');
    }

    // Get the first track (most GPX files have one track)
    const track = gpx.trk[0] as any;
    const trackSegments = track.trkseg || [];

    if (trackSegments.length === 0) {
      throw new Error('No track segments found in GPX file');
    }

    // Collect all track points
    const allPoints: GPXTrackPoint[] = [];
    for (const segment of trackSegments) {
      if (segment.trkpt && Array.isArray(segment.trkpt)) {
        allPoints.push(...segment.trkpt);
      }
    }

    if (allPoints.length === 0) {
      throw new Error('No track points found in GPX file');
    }

    // Calculate workout metrics
    const metrics = calculateMetrics(allPoints);

    // Extract metadata
    const workoutName = track.name?.[0] || 'GPX Import';
    const workoutType = track.type?.[0] || 'Run';
    const startTime = allPoints[0].time?.[0] ? new Date(allPoints[0].time[0]) : new Date();
    const endTime = allPoints[allPoints.length - 1].time?.[0]
      ? new Date(allPoints[allPoints.length - 1].time[0])
      : new Date();

    // Calculate duration in seconds
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    // Create workout data
    const workoutData = {
      userId,
      date: startTime,
      type: mapGPXTypeToWorkoutType(workoutType),
      distance: metrics.totalDistance,
      duration: durationSeconds,
      pace: metrics.totalDistance > 0 ? durationSeconds / metrics.totalDistance : 0,
      elevationGain: metrics.elevationGain,
      calories: estimateCalories(metrics.totalDistance, durationSeconds),
      heartRate: metrics.averageHeartRate || null,
      source: 'GPX' as const,
      sourceMetadata: {
        fileName: workoutName,
        trackType: workoutType,
        totalPoints: allPoints.length,
        segments: trackSegments.length,
      },
    };

    return { workoutData, trackPoints: allPoints };
  } catch (error: any) {
    console.error('Error parsing GPX file:', error);
    throw new Error(`Failed to parse GPX file: ${error.message}`);
  }
}

/**
 * Calculate metrics from track points
 */
function calculateMetrics(points: GPXTrackPoint[]) {
  let totalDistance = 0; // in kilometers
  let elevationGain = 0;
  let heartRateSum = 0;
  let heartRateCount = 0;
  let previousPoint: GPXTrackPoint | null = null;
  let previousElevation: number | null = null;

  for (const point of points) {
    // Calculate distance
    if (previousPoint) {
      const distance = haversineDistance(
        parseFloat(previousPoint.$.lat),
        parseFloat(previousPoint.$.lon),
        parseFloat(point.$.lat),
        parseFloat(point.$.lon)
      );
      totalDistance += distance;
    }

    // Calculate elevation gain
    if (point.ele && point.ele[0]) {
      const elevation = parseFloat(point.ele[0]);
      if (previousElevation !== null && elevation > previousElevation) {
        elevationGain += elevation - previousElevation;
      }
      previousElevation = elevation;
    }

    // Extract heart rate from extensions if available
    if (point.extensions) {
      try {
        const hr = extractHeartRate(point.extensions);
        if (hr) {
          heartRateSum += hr;
          heartRateCount++;
        }
      } catch (e) {
        // Ignore heart rate extraction errors
      }
    }

    previousPoint = point;
  }

  return {
    totalDistance,
    elevationGain,
    averageHeartRate: heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : null,
  };
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Extract heart rate from GPX extensions
 */
function extractHeartRate(extensions: any): number | null {
  try {
    // Try common GPX extension formats
    if (extensions.TrackPointExtension && extensions.TrackPointExtension[0]) {
      const tpe = extensions.TrackPointExtension[0];
      if (tpe.hr && tpe.hr[0]) {
        return parseInt(tpe.hr[0], 10);
      }
    }

    // Try Garmin format
    if (extensions['gpxtpx:TrackPointExtension'] && extensions['gpxtpx:TrackPointExtension'][0]) {
      const tpe = extensions['gpxtpx:TrackPointExtension'][0];
      if (tpe['gpxtpx:hr'] && tpe['gpxtpx:hr'][0]) {
        return parseInt(tpe['gpxtpx:hr'][0], 10);
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Map GPX activity type to FitTrack workout type
 */
function mapGPXTypeToWorkoutType(gpxType: string): string {
  const typeMap: Record<string, string> = {
    running: 'Run',
    run: 'Run',
    cycling: 'Cycling',
    bike: 'Cycling',
    walking: 'Walk',
    walk: 'Walk',
    hiking: 'Hike',
    hike: 'Hike',
    swimming: 'Swim',
    swim: 'Swim',
  };

  return typeMap[gpxType.toLowerCase()] || 'Run';
}

/**
 * Estimate calories burned based on distance and duration
 * Rough estimate: ~60 calories per km for running
 */
function estimateCalories(distanceKm: number, durationSeconds: number): number {
  const caloriesPerKm = 60;
  return Math.round(distanceKm * caloriesPerKm);
}

/**
 * Import a GPX file and create a workout
 */
export async function importGPXWorkout(gpxContent: string, userId: string, fileName?: string) {
  try {
    // Check for duplicate based on file content hash or first timestamp
    const { workoutData, trackPoints } = await parseGPXFile(gpxContent, userId);

    // Add file name to metadata if provided
    if (fileName) {
      workoutData.sourceMetadata = {
        ...workoutData.sourceMetadata,
        originalFileName: fileName,
      };
    }

    // Create the workout
    const workout = await prisma.workout.create({
      data: workoutData,
    });

    return {
      success: true,
      workout,
      stats: {
        totalPoints: trackPoints.length,
        distance: workoutData.distance,
        duration: workoutData.duration,
      },
    };
  } catch (error: any) {
    console.error('Error importing GPX workout:', error);
    throw error;
  }
}
