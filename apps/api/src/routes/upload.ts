import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '@fittrack/database';
import { processWorkoutScreenshot } from '../services/ocr.service.js';
import { requireAuth } from '../middleware/auth';

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
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  }
});

// POST /api/upload - Upload and process workout screenshot
router.post('/', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(`📤 Processing screenshot: ${req.file.filename}`);

    // Read image buffer for Gemini vision
    const imageBuffer = fs.readFileSync(req.file.path);

    // Process with OCR + Gemini
    const result = await processWorkoutScreenshot(req.file.path, imageBuffer);

    // Create workout in database
    const { splits, ...workoutFields } = result.workoutData;

    const workout = await prisma.workout.create({
      data: {
        ...workoutFields,
        userId: req.user!.id, // Use authenticated user's ID
        date: new Date(result.workoutData.date),
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
      error: error instanceof Error ? error.message : 'Failed to process screenshot'
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
