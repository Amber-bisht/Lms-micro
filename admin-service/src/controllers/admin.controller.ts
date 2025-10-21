import { Request, Response } from 'express';
import redisClient from '../utils/redis';
import { logger } from '../utils/logger';

export const adminController = {
  async getSystemStats(req: Request, res: Response) {
    try {
      // For now, return mock dashboard stats since we don't have database connections
      // In a real implementation, you would fetch these from the respective services
      const stats = {
        categories: 0,
        courses: 0,
        users: 0,
        enrollments: 0,
        comments: 0,
        recentReviewsList: [],
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        cpuUsage: process.cpuUsage()
      };

      res.json(stats);
    } catch (error) {
      logger.error('Error fetching system stats:', error);
      res.status(500).json({ error: 'Failed to fetch system stats' });
    }
  },

  async getRedisKeys(req: Request, res: Response) {
    try {
      const { pattern = '*' } = req.query;
      const keys = await redisClient.keys(pattern as string);
      res.json({ keys, count: keys.length });
    } catch (error) {
      logger.error('Error fetching Redis keys:', error);
      res.status(500).json({ error: 'Failed to fetch Redis keys' });
    }
  },

  async getRedisValue(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const value = await redisClient.get(key);
      
      if (value === null) {
        return res.status(404).json({ error: 'Key not found' });
      }

      res.json({ key, value });
    } catch (error) {
      logger.error('Error fetching Redis value:', error);
      res.status(500).json({ error: 'Failed to fetch Redis value' });
    }
  },

  async deleteRedisKey(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const result = await redisClient.del(key);
      
      if (result === 0) {
        return res.status(404).json({ error: 'Key not found' });
      }

      res.json({ message: 'Key deleted successfully', key });
    } catch (error) {
      logger.error('Error deleting Redis key:', error);
      res.status(500).json({ error: 'Failed to delete Redis key' });
    }
  },

  async flushRedis(req: Request, res: Response) {
    try {
      await redisClient.flushAll();
      logger.warn('Redis flushed by admin');
      res.json({ message: 'Redis cache cleared successfully' });
    } catch (error) {
      logger.error('Error flushing Redis:', error);
      res.status(500).json({ error: 'Failed to flush Redis' });
    }
  },

  async getRedisInfo(req: Request, res: Response) {
    try {
      const info = await redisClient.info();
      const dbSize = await redisClient.dbSize();
      
      res.json({ 
        info: info.split('\r\n').filter(line => line && !line.startsWith('#')),
        dbSize 
      });
    } catch (error) {
      logger.error('Error fetching Redis info:', error);
      res.status(500).json({ error: 'Failed to fetch Redis info' });
    }
  },

  async clearCacheByPattern(req: Request, res: Response) {
    try {
      const { pattern } = req.body;
      
      if (!pattern) {
        return res.status(400).json({ error: 'Pattern is required' });
      }

      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      logger.info(`Cleared ${keys.length} keys matching pattern: ${pattern}`);
      res.json({ message: `Cleared ${keys.length} keys`, pattern });
    } catch (error) {
      logger.error('Error clearing cache by pattern:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }
};

