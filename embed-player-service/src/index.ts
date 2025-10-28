import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/config';
import { logger } from './utils/logger';
import embedRoutes from './routes/embed.routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes
app.use('/api/embed', embedRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Embed Player Service',
    version: '1.0.0',
    endpoints: {
      health: '/api/embed/health',
      createSession: 'POST /api/embed/session',
      getSession: 'GET /api/embed/session/:token',
      player: 'GET /api/embed/player/:token',
      info: 'GET /api/embed/info/:token',
      deactivate: 'PUT /api/embed/session/:token/deactivate',
      userSessions: 'GET /api/embed/user/:userId/sessions'
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectToDatabase();
  
  const PORT = config.port;
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Embed Player Service running on port ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`MongoDB: ${config.mongodbUri}`);
  });
};

startServer();

export default app;
