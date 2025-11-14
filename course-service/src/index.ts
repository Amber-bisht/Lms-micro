import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB, disconnectDB } from './config/database';
import { logger } from './utils/logger';
import { logEnvironmentVariables } from './utils/env-logger';
import config from './config/config';
import courseRoutes from './routes/course.routes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
app.use(cors({
  origin: config.NODE_ENV === 'production' 
    ? ['https://lms.amberbisht.me', 'https://www.lms.amberbisht.me']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000', 'http://localhost:3001'],
  credentials: true,
}));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'course-service' });
});

// Routes
app.use('/api/courses', courseRoutes);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(`Error: ${message}`);
  res.status(status).json({ message });
});

// Initialize app
(async () => {
  try {
    // Log environment variables
    logEnvironmentVariables('course-service', config);
    
    await connectDB();
    
    const port = config.PORT;
    app.listen(port, '0.0.0.0', () => {
      logger.info(`🚀 Course Service running on port ${port}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error(`Server initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

