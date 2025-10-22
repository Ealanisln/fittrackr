import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import workoutsRouter from './routes/workouts.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';
import integrationsRouter from './routes/integrations.js';
import filesRouter from './routes/files.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check with database and Redis connectivity
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Check database connection
    const { prisma } = await import('@fittrack/database');
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'ok';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Check Redis connection
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await redis.ping();
    await redis.quit();
    health.services.redis = 'ok';
  } catch (error) {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'FitTrack API' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/files', filesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
