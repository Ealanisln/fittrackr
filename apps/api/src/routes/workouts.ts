import { Router } from 'express';
import { prisma } from '@fittrack/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Apply authentication to all workout routes
router.use(requireAuth);

// GET /api/workouts - Get all workouts for the authenticated user
router.get('/', async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        splits: {
          orderBy: {
            splitNumber: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json({
      success: true,
      data: workouts
    });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workouts'
    });
  }
});

// GET /api/workouts/:id - Get a single workout
router.get('/:id', async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id // Ensure user can only access their own workouts
      },
      include: {
        splits: {
          orderBy: {
            splitNumber: 'asc'
          }
        }
      }
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    res.json({
      success: true,
      data: workout
    });
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workout'
    });
  }
});

// POST /api/workouts - Create a new workout
router.post('/', async (req, res) => {
  try {
    const { splits, ...workoutData } = req.body;

    const workout = await prisma.workout.create({
      data: {
        ...workoutData,
        userId: req.user!.id, // Automatically set the user ID
        date: new Date(workoutData.date),
        splits: splits ? {
          create: splits
        } : undefined
      },
      include: {
        splits: true
      }
    });

    res.status(201).json({
      success: true,
      data: workout
    });
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workout'
    });
  }
});

// PUT /api/workouts/:id - Update a workout
router.put('/:id', async (req, res) => {
  try {
    const { splits, ...workoutData } = req.body;

    // First check if workout belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!existingWorkout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    const workout = await prisma.workout.update({
      where: {
        id: req.params.id
      },
      data: {
        ...workoutData,
        date: workoutData.date ? new Date(workoutData.date) : undefined,
      },
      include: {
        splits: true
      }
    });

    res.json({
      success: true,
      data: workout
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workout'
    });
  }
});

// DELETE /api/workouts/:id - Delete a workout
router.delete('/:id', async (req, res) => {
  try {
    // First check if workout belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!existingWorkout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    await prisma.workout.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workout'
    });
  }
});

export default router;
