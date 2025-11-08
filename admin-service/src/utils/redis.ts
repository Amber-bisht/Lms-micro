import { createClient } from 'redis';
import { logger } from './logger';
import config from '../config/config';

const redisClient = createClient({
  url: config.REDIS_URL,
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

