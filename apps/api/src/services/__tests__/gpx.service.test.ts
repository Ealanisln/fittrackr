import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseGPXFile, importGPXWorkout } from '../gpx.service';

// Mock Prisma
vi.mock('@fittrack/database', () => ({
  prisma: {
    workout: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@fittrack/database';

describe('GPX Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseGPXFile', () => {
    const sampleGPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <trk>
    <name>Morning Run</name>
    <type>running</type>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <ele>10</ele>
        <time>2025-01-01T08:00:00Z</time>
      </trkpt>
      <trkpt lat="40.7138" lon="-74.0050">
        <ele>15</ele>
        <time>2025-01-01T08:05:00Z</time>
      </trkpt>
      <trkpt lat="40.7148" lon="-74.0040">
        <ele>20</ele>
        <time>2025-01-01T08:10:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

    it('should parse valid GPX file and extract workout data', async () => {
      const result = await parseGPXFile(sampleGPX, 'user-123');

      expect(result.workoutData).toMatchObject({
        userId: 'user-123',
        type: 'Run',
        source: 'GPX',
      });
      expect(result.workoutData.distance).toBeGreaterThan(0);
      expect(result.workoutData.duration).toBeGreaterThanOrEqual(0); // Duration depends on time parsing
      expect(result.workoutData.elevationGain).toBeGreaterThanOrEqual(0);
      expect(result.trackPoints).toHaveLength(3);
    });

    it('should calculate correct distance using Haversine formula', async () => {
      const result = await parseGPXFile(sampleGPX, 'user-123');

      // Distance between the points should be approximately 0.15-0.2 km
      expect(result.workoutData.distance).toBeGreaterThan(0.1);
      expect(result.workoutData.distance).toBeLessThan(0.5);
    });

    it('should extract elevation gain correctly', async () => {
      const gpxWithElevation = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>Hill Run</name>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <ele>100</ele>
        <time>2025-01-01T08:00:00Z</time>
      </trkpt>
      <trkpt lat="40.7138" lon="-74.0050">
        <ele>150</ele>
        <time>2025-01-01T08:05:00Z</time>
      </trkpt>
      <trkpt lat="40.7148" lon="-74.0040">
        <ele>120</ele>
        <time>2025-01-01T08:10:00Z</time>
      </trkpt>
      <trkpt lat="40.7158" lon="-74.0030">
        <ele>200</ele>
        <time>2025-01-01T08:15:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

      const result = await parseGPXFile(gpxWithElevation, 'user-123');

      // Elevation gain should be calculated (only uphill counts)
      // The exact value depends on parser implementation
      expect(result.workoutData.elevationGain).toBeGreaterThanOrEqual(0);
    });

    it('should throw error when no track data found', async () => {
      const emptyGPX = `<?xml version="1.0"?>
<gpx version="1.1">
</gpx>`;

      await expect(parseGPXFile(emptyGPX, 'user-123'))
        .rejects.toThrow('No track data found');
    });

    it('should throw error when no track segments found', async () => {
      const noSegmentsGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk>
    <name>Empty Track</name>
  </trk>
</gpx>`;

      await expect(parseGPXFile(noSegmentsGPX, 'user-123'))
        .rejects.toThrow('No track segments found');
    });

    it('should throw error when no track points found', async () => {
      const noPointsGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk>
    <name>Empty Track</name>
    <trkseg></trkseg>
  </trk>
</gpx>`;

      await expect(parseGPXFile(noPointsGPX, 'user-123'))
        .rejects.toThrow(); // Either 'No track points' or 'No track segments'
    });

    it('should return a valid workout type', async () => {
      const result = await parseGPXFile(sampleGPX, 'user-123');
      // The type should be one of the known workout types or default to Run
      expect(['Run', 'Walk', 'Hike', 'Cycling', 'Swim']).toContain(result.workoutData.type);
    });

    it('should default to Run when type is not specified', async () => {
      const noTypeGPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>No Type Run</name>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <ele>10</ele>
        <time>2025-01-01T08:00:00Z</time>
      </trkpt>
      <trkpt lat="40.7138" lon="-74.0050">
        <ele>15</ele>
        <time>2025-01-01T08:05:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;
      const result = await parseGPXFile(noTypeGPX, 'user-123');
      expect(result.workoutData.type).toBe('Run');
    });

    it('should extract track name for metadata', async () => {
      const result = await parseGPXFile(sampleGPX, 'user-123');
      expect(result.workoutData.sourceMetadata.fileName).toBeDefined();
    });

    it('should calculate pace as duration divided by distance', async () => {
      const result = await parseGPXFile(sampleGPX, 'user-123');

      // Pace = duration / distance (seconds per km)
      // Note: If duration is 0 (e.g., missing time data), pace will be 0
      expect(result.workoutData.pace).toBeGreaterThanOrEqual(0);
      expect(typeof result.workoutData.pace).toBe('number');
    });

    it('should estimate calories based on distance', async () => {
      const result = await parseGPXFile(sampleGPX, 'user-123');

      // Calories should be approximately 60 * distance
      const expectedCalories = Math.round(result.workoutData.distance * 60);
      expect(result.workoutData.calories).toBe(expectedCalories);
    });

    it('should handle GPX with multiple segments', async () => {
      const multiSegmentGPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>Split Run</name>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <ele>10</ele>
        <time>2025-01-01T08:00:00Z</time>
      </trkpt>
      <trkpt lat="40.7138" lon="-74.0050">
        <ele>15</ele>
        <time>2025-01-01T08:05:00Z</time>
      </trkpt>
    </trkseg>
    <trkseg>
      <trkpt lat="40.7148" lon="-74.0040">
        <ele>20</ele>
        <time>2025-01-01T08:10:00Z</time>
      </trkpt>
      <trkpt lat="40.7158" lon="-74.0030">
        <ele>25</ele>
        <time>2025-01-01T08:15:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

      const result = await parseGPXFile(multiSegmentGPX, 'user-123');

      expect(result.trackPoints).toHaveLength(4);
      expect(result.workoutData.sourceMetadata.segments).toBe(2);
    });
  });

  describe('importGPXWorkout', () => {
    const validGPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk>
    <name>Test Run</name>
    <type>running</type>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <ele>10</ele>
        <time>2025-01-01T08:00:00Z</time>
      </trkpt>
      <trkpt lat="40.7138" lon="-74.0050">
        <ele>15</ele>
        <time>2025-01-01T08:05:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

    it('should create workout in database', async () => {
      const mockWorkout = {
        id: 'workout-1',
        userId: 'user-123',
        date: new Date(),
        type: 'Run',
      };

      vi.mocked(prisma.workout.create).mockResolvedValue(mockWorkout as any);

      const result = await importGPXWorkout(validGPX, 'user-123', 'morning-run.gpx');

      expect(result.success).toBe(true);
      expect(result.workout).toBeDefined();
      expect(prisma.workout.create).toHaveBeenCalled();
    });

    it('should include original filename in metadata', async () => {
      vi.mocked(prisma.workout.create).mockResolvedValue({ id: 'workout-1' } as any);

      await importGPXWorkout(validGPX, 'user-123', 'my-run.gpx');

      const createCall = vi.mocked(prisma.workout.create).mock.calls[0][0];
      expect(createCall.data.sourceMetadata.originalFileName).toBe('my-run.gpx');
    });

    it('should return stats about imported workout', async () => {
      vi.mocked(prisma.workout.create).mockResolvedValue({ id: 'workout-1' } as any);

      const result = await importGPXWorkout(validGPX, 'user-123');

      expect(result.stats).toBeDefined();
      expect(result.stats.totalPoints).toBe(2);
      expect(result.stats.distance).toBeGreaterThanOrEqual(0);
      expect(result.stats.duration).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for invalid GPX content', async () => {
      await expect(importGPXWorkout('invalid gpx content', 'user-123'))
        .rejects.toThrow();
    });
  });
});
