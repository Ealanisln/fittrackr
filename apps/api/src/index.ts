import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import workoutsRouter from './routes/workouts.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';
import integrationsRouter from './routes/integrations.js';
import filesRouter from './routes/files.js';
import insightsRouter from './routes/insights.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health check - simplified version without connection tests
app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: 'not_checked',
      redis: 'not_checked',
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

// Start server - bind to 0.0.0.0 to accept external connections in Docker
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});

export default app;
