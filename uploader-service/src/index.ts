import express from 'express';
import cors from 'cors';
import path from 'path';
import config from './config/config';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import uploadRoutes from './routes/upload.routes';
import fileToLinkRoutes from './routes/file-to-link.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', service: 'uploader-service' });
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/file-to-link', fileToLinkRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: `File too large. Maximum size is ${config.MAX_FILE_SIZE / 1024 / 1024}MB` 
      });
    }
    return res.status(400).json({ message: err.message });
  }
  
  res.status(500).json({ 
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(config.PORT, () => {
      logger.info(`✓ Uploader Service running on port ${config.PORT}`);
      logger.info(`✓ Environment: ${config.NODE_ENV}`);
      logger.info(`✓ Upload directory: ${config.UPLOAD_DIR}`);
      logger.info(`✓ Max file size: ${config.MAX_FILE_SIZE / 1024 / 1024}MB`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Import multer for error handling
import multer from 'multer';

