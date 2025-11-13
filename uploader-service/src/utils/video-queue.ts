import Bull, { Job } from 'bull';
import redis from 'ioredis';
import { logger } from './logger';
import config from '../config/config';

// Parse Redis URL to extract connection details
const parseRedisUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const isUpstash = url.toLowerCase().includes('upstash') || url.startsWith('rediss://');
    
    // Normalize URL: if Upstash but using redis://, convert to rediss://
    let redisUrl = url;
    if (isUpstash && redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
      redisUrl = redisUrl.replace('redis://', 'rediss://');
      logger.info('🔒 Converted Redis URL to use TLS (rediss://) for Upstash');
    }
    
    return {
      url: redisUrl,
      isUpstash,
      host: parsedUrl.hostname,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : (isUpstash ? 6380 : 6379),
      password: parsedUrl.password || undefined,
      username: parsedUrl.username || undefined,
    };
  } catch (error) {
    // If URL parsing fails, fall back to host/port
    logger.warn('Failed to parse REDIS_URL, using host/port fallback');
    return {
      url: null,
      isUpstash: false,
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: undefined,
      username: undefined,
    };
  }
};

// Create separate Redis clients for Bull queue
// Bull requires separate clients for client and subscriber without certain options
const createRedisClient = (type: 'client' | 'subscriber') => {
  const redisConfig = parseRedisUrl(config.REDIS_URL);
  const isUpstash = redisConfig.isUpstash;
  
  if (isUpstash) {
    logger.info('🔐 Upstash Redis detected - TLS will be enabled');
  }
  
  // ioredis configuration
  const clientConfig: any = {
    // Remove maxRetriesPerRequest and enableReadyCheck for Bull compatibility
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Enable TLS for Upstash
    ...(isUpstash && {
      tls: {
        rejectUnauthorized: true,
      },
    }),
  };
  
  // Use URL if available (ioredis supports URL format)
  if (redisConfig.url) {
    clientConfig.host = redisConfig.host;
    clientConfig.port = redisConfig.port;
    if (redisConfig.password) {
      clientConfig.password = redisConfig.password;
    }
    if (redisConfig.username && redisConfig.username !== 'default') {
      clientConfig.username = redisConfig.username;
    }
  } else {
    // Fallback to host/port
    clientConfig.host = redisConfig.host;
    clientConfig.port = redisConfig.port;
  }
  
  const client = new redis(clientConfig);
  
  // Add connection event handlers
  client.on('connect', () => {
    logger.info(`✅ Redis ${type} connected`);
  });
  
  client.on('ready', () => {
    logger.info(`✅ Redis ${type} ready`);
  });
  
  client.on('error', (err) => {
    logger.error(`❌ Redis ${type} error:`, err.message);
  });
  
  client.on('close', () => {
    logger.warn(`⚠️ Redis ${type} connection closed`);
  });
  
  client.on('reconnecting', () => {
    logger.info(`🔄 Redis ${type} reconnecting...`);
  });
  
  return client;
};

export const videoQueue = new Bull('video-processing', {
  createClient: (type: 'client' | 'subscriber') => createRedisClient(type),
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

