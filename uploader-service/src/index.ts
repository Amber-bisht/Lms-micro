import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import config from './config/config';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import uploadRoutes from './routes/upload.routes';
import fileToLinkRoutes from './routes/file-to-link.routes';
import videoRoutes from './routes/video.routes';
import { videoQueue, processVideoJob } from './utils/video-queue';
import { updateVideoStatus } from './controllers/video.controller';

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://lms.amberbisht.me', 
    'https://www.lms.amberbisht.me',
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5000',
    'http://lms.amberbisht.me'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'Accept'],
}));
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
app.use('/api/videos', videoRoutes);

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

// Process video queue
videoQueue.process('process-video', async (job: any) => {
  try {
    logger.info(`Processing video job: ${job.id}`);
    await updateVideoStatus(job.data.videoId, 'processing');
    
    const result = await processVideoJob(job);
    
    // If using S3, upload all HLS files to S3
    if (job.data.storageType === 's3') {
      try {
        const s3Service = (await import('./utils/s3-service')).default;
        const fs = await import('fs/promises');
        
        // Upload all .m3u8 and .ts files
        const outputDir = `./uploads/videos/${job.data.userId}`;
        
        // Upload master playlist files
        if (result.hls720Url) {
          const hls720Path = result.hls720Url.replace(/^\/uploads\//, './uploads/');
          if (await fs.stat(hls720Path).catch(() => null)) {
            const fileBuffer = await fs.readFile(hls720Path);
            await s3Service.uploadFile(
              result.hls720S3Key!,
              fileBuffer,
              'application/vnd.apple.mpegurl'
            );
            logger.info(`Uploaded 720p playlist to S3`);
          }
        }
        
        if (result.hls1080Url) {
          const hls1080Path = result.hls1080Url.replace(/^\/uploads\//, './uploads/');
          if (await fs.stat(hls1080Path).catch(() => null)) {
            const fileBuffer = await fs.readFile(hls1080Path);
            await s3Service.uploadFile(
              result.hls1080S3Key!,
              fileBuffer,
              'application/vnd.apple.mpegurl'
            );
            logger.info(`Uploaded 1080p playlist to S3`);
          }
        }
        
        // Upload all .ts segment files
        const files = await fs.readdir(outputDir);
        const tsFiles = files.filter(f => f.endsWith('.ts'));
        
        for (const tsFile of tsFiles) {
          const tsPath = `${outputDir}/${tsFile}`;
          const s3Key = `videos/${job.data.userId}/${tsFile}`;
          const fileBuffer = await fs.readFile(tsPath);
          await s3Service.uploadFile(s3Key, fileBuffer, 'video/MP2T');
        }
        
        logger.info(`Uploaded ${tsFiles.length} segment files to S3`);
      } catch (error) {
        logger.error('S3 upload error for HLS files:', error);
      }
    }
    
    await updateVideoStatus(job.data.videoId, 'completed', result);
    
    return result;
  } catch (error) {
    logger.error(`Video processing failed for job ${job.id}:`, error);
    await updateVideoStatus(job.data.videoId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
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
      logger.info(`✓ Video processing queue initialized`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

