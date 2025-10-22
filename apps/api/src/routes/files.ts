import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { requireAuth } from '../middleware/auth.js';
import { importGPXWorkout } from '../services/gpx.service.js';
import { importFITWorkout, importMultipleFITWorkouts } from '../services/fit.service.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error: any) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.gpx', '.fit'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`));
    }
  },
});

/**
 * POST /api/files/upload
 * Upload a single GPX or FIT file
 */
router.post('/upload', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const userId = req.user!.id;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const filePath = req.file.path;

    let result;

    try {
      if (fileExtension === '.gpx') {
        // Parse GPX file
        const gpxContent = await fs.readFile(filePath, 'utf-8');
        result = await importGPXWorkout(gpxContent, userId, req.file.originalname);
      } else if (fileExtension === '.fit') {
        // Parse FIT file
        const fitBuffer = await fs.readFile(filePath);
        result = await importFITWorkout(fitBuffer, userId, req.file.originalname);
      } else {
        throw new Error('Unsupported file type');
      }

      // Clean up uploaded file
      await fs.unlink(filePath).catch((err) => console.error('Error deleting file:', err));

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Workout imported successfully',
      });
    } catch (parseError: any) {
      // Clean up uploaded file on error
      await fs.unlink(filePath).catch((err) => console.error('Error deleting file:', err));
      throw parseError;
    }
  } catch (error: any) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process file',
    });
  }
});

/**
 * POST /api/files/upload-multiple
 * Upload multiple GPX or FIT files
 */
router.post('/upload-multiple', requireAuth, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const userId = req.user!.id;
    const results = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
    };

    for (const file of req.files) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const filePath = file.path;

      try {
        let result;

        if (fileExtension === '.gpx') {
          const gpxContent = await fs.readFile(filePath, 'utf-8');
          result = await importGPXWorkout(gpxContent, userId, file.originalname);
          results.imported++;
          results.details.push({
            fileName: file.originalname,
            status: 'imported',
            workout: result.workout,
          });
        } else if (fileExtension === '.fit') {
          const fitBuffer = await fs.readFile(filePath);
          const fitResult = await importFITWorkout(fitBuffer, userId, file.originalname);

          if (fitResult.success) {
            results.imported++;
            results.details.push({
              fileName: file.originalname,
              status: 'imported',
              workout: fitResult.workout,
            });
          } else if (fitResult.duplicate) {
            results.skipped++;
            results.details.push({
              fileName: file.originalname,
              status: 'skipped',
              reason: 'duplicate',
            });
          }
        }

        // Clean up uploaded file
        await fs.unlink(filePath).catch((err) => console.error('Error deleting file:', err));
      } catch (error: any) {
        results.errors++;
        results.details.push({
          fileName: file.originalname,
          status: 'error',
          error: error.message,
        });

        // Clean up uploaded file on error
        await fs.unlink(filePath).catch((err) => console.error('Error deleting file:', err));
      }
    }

    return res.status(200).json({
      success: true,
      data: results,
      message: `Processed ${req.files.length} files: ${results.imported} imported, ${results.skipped} skipped, ${results.errors} errors`,
    });
  } catch (error: any) {
    console.error('Multiple file upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process files',
    });
  }
});

/**
 * GET /api/files/supported-formats
 * Get list of supported file formats
 */
router.get('/supported-formats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          extension: '.gpx',
          name: 'GPS Exchange Format',
          description: 'GPX files from Garmin, Strava, and other GPS devices',
          maxSize: '10MB',
        },
        {
          extension: '.fit',
          name: 'Flexible and Interoperable Data Transfer',
          description: 'FIT files from Garmin watches and bike computers',
          maxSize: '10MB',
        },
      ],
    },
  });
});

export default router;
