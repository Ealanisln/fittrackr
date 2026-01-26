import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from '@fittrack/database';
import workoutsRouter from './routes/workouts.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';
import integrationsRouter from './routes/integrations.js';
import filesRouter from './routes/files.js';
import insightsRouter from './routes/insights.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Server readiness state
let isReady = false;
let isShuttingDown = false;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for API
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Reject requests during shutdown
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    return res.status(503).json({ error: 'Server is shutting down' });
  }
  next();
});

// Readiness check - used by container orchestration
// Returns 503 until the server is fully ready with DB connection verified
app.get('/health/ready', async (req, res) => {
  if (!isReady || isShuttingDown) {
    return res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      ready: false,
    });
  }

  try {
    // Verify database connectivity with a timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database check timeout')), 3000)
    );
    const dbCheckPromise = prisma.$queryRaw`SELECT 1`;

    await Promise.race([dbCheckPromise, timeoutPromise]);

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ready: true,
      services: {
        api: 'ok',
        database: 'ok',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Liveness check - simplified for backwards compatibility
app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: isReady ? 'connected' : 'not_checked',
    },
  });
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
app.use('/api/insights', insightsRouter);

// Initialize database connection and start server
async function startServer() {
  try {
    // Verify database connection before marking as ready
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start server - bind to 0.0.0.0 to accept external connections in Docker
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      isReady = true;
    });

    // Configure server timeouts
    server.setTimeout(30000); // 30s request timeout
    server.keepAliveTimeout = 65000; // Slightly higher than typical ALB 60s timeout
    server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📤 Received ${signal}, starting graceful shutdown...`);
      isShuttingDown = true;

      // Stop accepting new connections
      server.close(async () => {
        console.log('🔒 HTTP server closed');

        try {
          // Disconnect Prisma
          await prisma.$disconnect();
          console.log('🔌 Database disconnected');
          console.log('✅ Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force exit after 30s if graceful shutdown fails
      setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
