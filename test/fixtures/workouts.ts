/**
 * Mock workout data for testing
 */

export const mockWorkout = {
  id: 'workout-1',
  userId: 'user-123',
  date: new Date('2025-01-15'),
  workoutType: 'Run',
  workoutTime: '0:45:00',
  distanceKm: 5.0,
  activeKcal: 350,
  totalKcal: 400,
  elevationGainM: 50,
  avgPace: "9'00\"/km",
  avgHeartRateBpm: 145,
  effortLevel: 7,
  effortDescription: 'Hard',
  source: 'MANUAL',
  sourceFileUrl: null,
  sourceMetadata: null,
  createdAt: new Date('2025-01-15T10:00:00Z'),
  updatedAt: new Date('2025-01-15T10:00:00Z'),
};

export const mockWorkoutWithSplits = {
  ...mockWorkout,
  id: 'workout-2',
  splits: [
    { id: 'split-1', workoutId: 'workout-2', splitNumber: 1, time: '9:00', pace: "9'00\"", heartRateBpm: 140 },
    { id: 'split-2', workoutId: 'workout-2', splitNumber: 2, time: '8:55', pace: "8'55\"", heartRateBpm: 145 },
    { id: 'split-3', workoutId: 'workout-2', splitNumber: 3, time: '9:05', pace: "9'05\"", heartRateBpm: 148 },
    { id: 'split-4', workoutId: 'workout-2', splitNumber: 4, time: '9:00', pace: "9'00\"", heartRateBpm: 150 },
    { id: 'split-5', workoutId: 'workout-2', splitNumber: 5, time: '9:00', pace: "9'00\"", heartRateBpm: 152 },
  ],
};

export const mockWorkoutFromScreenshot = {
  ...mockWorkout,
  id: 'workout-3',
  source: 'SCREENSHOT',
  sourceFileUrl: '/uploads/workout-screenshot.png',
  sourceMetadata: {
    ocrConfidence: 95,
    fileSize: 1024000,
    mimeType: 'image/png',
    processedAt: '2025-01-15T10:00:00Z',
  },
};

export const mockWorkoutFromGPX = {
  ...mockWorkout,
  id: 'workout-4',
  source: 'FILE',
  sourceFileUrl: '/uploads/morning-run.gpx',
  sourceMetadata: {
    originalFileName: 'morning-run.gpx',
    fileFormat: 'GPX',
    trackPoints: 1500,
  },
};

export const mockWorkouts = [
  mockWorkout,
  mockWorkoutWithSplits,
  mockWorkoutFromScreenshot,
  mockWorkoutFromGPX,
];

export const createMockWorkout = (overrides: Partial<typeof mockWorkout> = {}) => ({
  ...mockWorkout,
  ...overrides,
});
