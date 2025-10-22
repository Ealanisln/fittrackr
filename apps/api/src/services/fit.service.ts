import FitParser from 'fit-file-parser';
import { prisma } from '@fittrack/database';

interface FitParserOptions {
  force?: boolean;
  speedUnit?: 'km/h' | 'm/s' | 'mph';
  lengthUnit?: 'km' | 'm' | 'mi';
  temperatureUnit?: 'celsius' | 'kelvin' | 'fahrenheit';
  elapsedRecordField?: boolean;
  mode?: 'list' | 'cascade';
}

/**
 * Parse a FIT file and extract workout data
 */
export async function parseFITFile(fitBuffer: Buffer, userId: string) {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'celsius',
      mode: 'list',
    } as FitParserOptions);

    fitParser.parse(fitBuffer, (error: any, data: any) => {
      if (error) {
        console.error('FIT parser error:', error);
        return reject(new Error(`Failed to parse FIT file: ${error.message}`));
      }

      try {
        // Extract sessions (workouts)
        const sessions = data.sessions || [];
        if (sessions.length === 0) {
          return reject(new Error('No workout sessions found in FIT file'));
        }

        // Get the first session (most FIT files have one session per activity)
        const session = sessions[0];
        const records = data.records || [];
        const laps = data.laps || [];

        // Calculate metrics
        const metrics = calculateFITMetrics(session, records, laps);

        // Extract workout metadata
        const workoutType = mapFITSportToWorkoutType(session.sport || 'running');
        const startTime = session.start_time ? new Date(session.start_time) : new Date();

        // Create workout data
        const workoutData = {
          userId,
          date: startTime,
          type: workoutType,
          distance: metrics.distance,
          duration: metrics.duration,
          pace: metrics.pace,
          elevationGain: metrics.elevationGain || null,
          calories: session.total_calories || metrics.estimatedCalories,
          heartRate: metrics.averageHeartRate || null,
          source: 'FIT' as const,
          sourceMetadata: {
            sport: session.sport,
            subSport: session.sub_sport,
            totalRecords: records.length,
            totalLaps: laps.length,
            avgSpeed: session.avg_speed,
            maxSpeed: session.max_speed,
            avgCadence: session.avg_cadence,
            maxCadence: session.max_cadence,
            avgPower: session.avg_power,
            maxPower: session.max_power,
          },
        };

        resolve({ workoutData, session, records, laps });
      } catch (parseError: any) {
        console.error('Error processing FIT data:', parseError);
        reject(new Error(`Failed to process FIT data: ${parseError.message}`));
      }
    });
  });
}

/**
 * Calculate workout metrics from FIT data
 */
function calculateFITMetrics(session: any, records: any[], laps: any[]) {
  // Distance in kilometers
  const distance = session.total_distance || 0;

  // Duration in seconds
  const duration = session.total_timer_time || session.total_elapsed_time || 0;

  // Pace (seconds per km)
  const pace = distance > 0 ? duration / distance : 0;

  // Elevation gain in meters
  const elevationGain = session.total_ascent || calculateElevationGainFromRecords(records);

  // Average heart rate
  const averageHeartRate = session.avg_heart_rate || calculateAverageHeartRate(records);

  // Estimated calories if not provided
  const estimatedCalories = Math.round(distance * 60); // Rough estimate

  return {
    distance,
    duration,
    pace,
    elevationGain,
    averageHeartRate,
    estimatedCalories,
  };
}

/**
 * Calculate elevation gain from records
 */
function calculateElevationGainFromRecords(records: any[]): number {
  let elevationGain = 0;
  let previousAltitude: number | null = null;

  for (const record of records) {
    if (record.altitude !== undefined && record.altitude !== null) {
      if (previousAltitude !== null && record.altitude > previousAltitude) {
        elevationGain += record.altitude - previousAltitude;
      }
      previousAltitude = record.altitude;
    }
  }

  return elevationGain;
}

/**
 * Calculate average heart rate from records
 */
function calculateAverageHeartRate(records: any[]): number | null {
  const heartRates = records
    .filter((r) => r.heart_rate !== undefined && r.heart_rate !== null)
    .map((r) => r.heart_rate);

  if (heartRates.length === 0) {
    return null;
  }

  const sum = heartRates.reduce((acc, hr) => acc + hr, 0);
  return Math.round(sum / heartRates.length);
}

/**
 * Map FIT sport type to FitTrack workout type
 */
function mapFITSportToWorkoutType(fitSport: string): string {
  const sportMap: Record<string, string> = {
    running: 'Run',
    cycling: 'Cycling',
    walking: 'Walk',
    hiking: 'Hike',
    swimming: 'Swim',
    generic: 'Run',
    training: 'Run',
    transition: 'Run',
  };

  return sportMap[fitSport.toLowerCase()] || 'Run';
}

/**
 * Import a FIT file and create a workout
 */
export async function importFITWorkout(fitBuffer: Buffer, userId: string, fileName?: string) {
  try {
    const { workoutData, session }: any = await parseFITFile(fitBuffer, userId);

    // Add file name to metadata if provided
    if (fileName) {
      workoutData.sourceMetadata = {
        ...workoutData.sourceMetadata,
        originalFileName: fileName,
      };
    }

    // Check for duplicate based on timestamp and distance
    const existing = await prisma.workout.findFirst({
      where: {
        userId,
        source: 'FIT',
        date: workoutData.date,
        distance: workoutData.distance,
      },
    });

    if (existing) {
      return {
        success: false,
        message: 'Workout already exists (duplicate)',
        duplicate: true,
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
        distance: workoutData.distance,
        duration: workoutData.duration,
        sport: session.sport,
      },
    };
  } catch (error: any) {
    console.error('Error importing FIT workout:', error);
    throw error;
  }
}

/**
 * Parse multiple FIT files and import workouts
 */
export async function importMultipleFITWorkouts(fitFiles: Array<{ buffer: Buffer; fileName: string }>, userId: string) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: 0,
    details: [] as any[],
  };

  for (const file of fitFiles) {
    try {
      const result = await importFITWorkout(file.buffer, userId, file.fileName);

      if (result.success) {
        results.imported++;
        results.details.push({
          fileName: file.fileName,
          status: 'imported',
          workout: result.workout,
        });
      } else if (result.duplicate) {
        results.skipped++;
        results.details.push({
          fileName: file.fileName,
          status: 'skipped',
          reason: 'duplicate',
        });
      }
    } catch (error: any) {
      results.errors++;
      results.details.push({
        fileName: file.fileName,
        status: 'error',
        error: error.message,
      });
    }
  }

  return results;
}
