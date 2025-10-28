import Bull, { Job } from 'bull';
import redis from 'ioredis';
import { logger } from './logger';

const redisClient = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

export const videoQueue = new Bull('video-processing', {
  createClient: () => redisClient,
});

export interface VideoProcessingJob {
  videoId: string;
  inputPath: string;
  userId: string;
  filename: string;
  originalFilename: string;
  storageType: 'local' | 's3';
}

// Job processor - will be imported and set up in the main file
export const processVideoJob = async (job: Job<VideoProcessingJob>) => {
  const { videoId, inputPath, userId, filename, originalFilename, storageType } = job.data;
  
  logger.info(`Processing video job: ${videoId}`);
  
  try {
    // Import conversion function
    const { convertToHLS, generateThumbnail } = await import('./video-converter');
    
    // Get output directory
    const outputDir = `./uploads/videos/${userId}`;
    
    // Extract base filename without extension
    const baseFilename = filename.replace(/\.[^/.]+$/, '');
    
    // Convert to HLS
    const result = await convertToHLS(inputPath, outputDir, baseFilename, userId);
    
    // Generate thumbnail
    const thumbnailPath = `${outputDir}/thumb-${baseFilename}.jpg`;
    try {
      await generateThumbnail(inputPath, thumbnailPath);
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
    }
    
    logger.info(`Video processing completed: ${videoId}`);
    
    // Return result to update database
    return {
      hls720Url: result.hls720Url,
      hls720S3Key: result.hls720S3Key,
      hls1080Url: result.hls1080Url,
      hls1080S3Key: result.hls1080S3Key,
      duration: result.duration,
      thumbnail: storageType === 'local' ? `/uploads/videos/${userId}/thumb-${baseFilename}.jpg` : undefined,
    };
  } catch (error) {
    logger.error('Video processing error:', error);
    throw error;
  }
};

// Queue event handlers
videoQueue.on('completed', (job: any, result: any) => {
  logger.info(`Job ${job.id} completed:`, result);
});

videoQueue.on('failed', (job: any, error: any) => {
  logger.error(`Job ${job.id} failed:`, error);
});

videoQueue.on('active', (job: any) => {
  logger.info(`Job ${job.id} started`);
});

export default videoQueue;

