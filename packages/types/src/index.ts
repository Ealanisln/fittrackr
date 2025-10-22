import { z } from 'zod';

// ============================================
// Workout Schemas
// ============================================

export const SplitSchema = z.object({
  splitNumber: z.number().int().positive(),
  time: z.string(),
  pace: z.string(),
  heartRateBpm: z.number().int().positive(),
});

export const WorkoutSchema = z.object({
  date: z.string().or(z.date()),
  workoutType: z.string().optional(),
  workoutTime: z.string(),
  elapsedTime: z.string().optional(),
  distanceKm: z.number().positive(),
  activeKcal: z.number().int().positive(),
  totalKcal: z.number().int().positive(),
  elevationGainM: z.number().int().nonnegative(),
  avgPace: z.string(),
  avgHeartRateBpm: z.number().int().positive(),
  effortLevel: z.number().int().min(1).max(10),
  effortDescription: z.string(),
  splits: z.array(SplitSchema).optional(),
});

export const CreateWorkoutSchema = WorkoutSchema.extend({
  userId: z.string().cuid(),
  source: z.enum(['MANUAL', 'SCREENSHOT', 'STRAVA', 'GARMIN', 'GPX_FILE', 'FIT_FILE', 'APPLE_HEALTH']).default('MANUAL'),
});

// ============================================
// OCR Schemas
// ============================================

export const OCRResultSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(100),
  workout: WorkoutSchema.partial(),
});

// ============================================
// API Response Schemas
// ============================================

export const ApiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

// ============================================
// Types
// ============================================

export type Split = z.infer<typeof SplitSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
export type CreateWorkout = z.infer<typeof CreateWorkoutSchema>;
export type OCRResult = z.infer<typeof OCRResultSchema>;
export type ApiSuccess<T = any> = Omit<z.infer<typeof ApiSuccessSchema>, 'data'> & { data: T };
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;
