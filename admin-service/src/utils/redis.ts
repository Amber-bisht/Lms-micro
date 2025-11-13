import { createClient } from 'redis';
import { logger } from './logger';
import config from '../config/config';

// Check if URL is for Upstash (contains 'upstash' or uses 'rediss://')
const isUpstash = 
  config.REDIS_URL.toLowerCase().includes('upstash') || 
  config.REDIS_URL.startsWith('rediss://');

// Normalize URL: if Upstash but using redis://, convert to rediss://
let redisUrl = config.REDIS_URL;
if (isUpstash && redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
  redisUrl = redisUrl.replace('redis://', 'rediss://');
  logger.info('🔒 Converted Redis URL to use TLS (rediss://) for Upstash');
}

if (isUpstash) {
  logger.info('🔐 Upstash Redis detected - TLS will be enabled');
}

const redisClient = createClient({
  url: redisUrl,
  socket: {
    keepAlive: 30000, // Keep connection alive with 30s pings
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        logger.error('Redis reconnection failed after 20 attempts');
        return new Error('Redis reconnection failed');
      }
      // Exponential backoff: 100ms, 200ms, 400ms, ... max 3s
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000, // 10s connection timeout
    // Enable TLS for Upstash Redis (even if URL doesn't have rediss://)
    ...(isUpstash && {
      tls: true,
      rejectUnauthorized: true,
    }),
  },
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('✅ Redis connected'));
redisClient.on('ready', () => logger.info('✅ Redis ready'));
redisClient.on('reconnecting', () => logger.info('🔄 Redis reconnecting...'));
redisClient.on('end', () => logger.warn('⚠️ Redis connection ended'));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
};

export default redisClient;

