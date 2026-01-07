import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '@fittrack/database';
import { processWorkoutScreenshot } from '../services/ocr.service.js';
import { requireAuth } from '../middleware/auth';
import { generateInsightsForUser } from '../services/insights.service.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `workout-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no válido. Solo se permiten JPEG y PNG.'));
    }
  }
});

/**
 * Check for potential duplicate workouts
 */
async function findPotentialDuplicate(
  userId: string,
  date: Date,
  distanceKm: number,
  activeKcal: number
) {
  // Search for workouts on the same date with similar metrics
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      splits: true,
    },
  });

  // Check if any existing workout is similar (within 10% tolerance)
  for (const existing of existingWorkouts) {
    const distanceDiff = Math.abs(existing.distanceKm - distanceKm) / Math.max(distanceKm, 0.1);
    const caloriesDiff = Math.abs(existing.activeKcal - activeKcal) / Math.max(activeKcal, 1);

    // If distance and calories are within 10%, consider it a duplicate
    if (distanceDiff < 0.1 && caloriesDiff < 0.1) {
      return existing;
    }
  }

  return null;
}

// POST /api/upload - Upload and process workout screenshot
router.post('/', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se subió ningún archivo'
      });
    }

    const forceUpload = req.body.force === 'true' || req.body.force === true;

    console.log(`📤 Processing screenshot: ${req.file.filename}`);

    // Read image buffer for Gemini vision
    const imageBuffer = fs.readFileSync(req.file.path);

    // Process with OCR + Gemini
    const result = await processWorkoutScreenshot(req.file.path, imageBuffer);

    // Create workout in database
    const { splits, ...workoutFields } = result.workoutData;

    // Parse date avoiding timezone issues by treating it as noon local time
    const dateStr = result.workoutData.date;
    const workoutDate = dateStr.includes('T')
      ? new Date(dateStr)
      : new Date(`${dateStr}T12:00:00`);

    // Check for potential duplicates (unless force flag is set)
    if (!forceUpload) {
      const duplicate = await findPotentialDuplicate(
        req.user!.id,
        workoutDate,
        workoutFields.distanceKm || 0,
        workoutFields.activeKcal || 0
      );

      if (duplicate) {
        console.log(`⚠️ Potential duplicate found: ${duplicate.id}`);

        return res.status(409).json({
          success: false,
          isDuplicate: true,
          error: 'Ya existe un entrenamiento similar en esta fecha',
          existingWorkout: {
            id: duplicate.id,
            date: duplicate.date,
            workoutType: duplicate.workoutType,
            distanceKm: duplicate.distanceKm,
            activeKcal: duplicate.activeKcal,
            workoutTime: duplicate.workoutTime,
          },
          parsedWorkout: {
            date: workoutDate,
            workoutType: workoutFields.workoutType,
            distanceKm: workoutFields.distanceKm,
            activeKcal: workoutFields.activeKcal,
            workoutTime: workoutFields.workoutTime,
          },
          message: '¿Deseas subir este entrenamiento de todas formas?',
        });
      }
    }

    // Provide defaults for required fields that Gemini may not extract
    const workoutDataWithDefaults = {
      ...workoutFields,
      elevationGainM: workoutFields.elevationGainM ?? 0,
      effortLevel: workoutFields.effortLevel ?? 5,
      effortDescription: workoutFields.effortDescription ?? 'Moderado',
    };

    const workout = await prisma.workout.create({
      data: {
        ...workoutDataWithDefaults,
        userId: req.user!.id, // Use authenticated user's ID
        date: workoutDate,
        source: result.source,
        sourceFileUrl: req.file.path,
        sourceMetadata: {
          ocrConfidence: result.ocrResult.confidence,
          originalFilename: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        },
        splits: splits ? {
          create: splits
        } : undefined
      },
      include: {
        splits: true
      }
    });

    console.log(`✅ Workout created: ${workout.id}`);

    // Trigger insight generation asynchronously
    generateInsightsForUser(req.user!.id, workout).catch((err) => {
      console.error('Failed to generate insights:', err);
    });

    res.status(201).json({
      success: true,
      data: {
        workout,
        ocrConfidence: result.ocrResult.confidence,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing upload:', error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar la captura'
    });
  }
});

// GET /api/upload/status - Check upload service status
router.get('/status', (req, res) => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  res.json({
    success: true,
    data: {
      uploadDir,
      uploadDirExists: fs.existsSync(uploadDir),
      geminiConfigured: hasGeminiKey,
      maxFileSize: process.env.MAX_FILE_SIZE || '5242880'
    }
  });
});

export default router;
