import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';

const router = Router();

// System stats
router.get('/stats', adminController.getSystemStats);

// Redis management (admin only - auth handled by API Gateway)
router.get('/redis/keys', adminController.getRedisKeys);
router.get('/redis/key/:key', adminController.getRedisValue);
router.delete('/redis/key/:key', adminController.deleteRedisKey);
router.post('/redis/flush', adminController.flushRedis);
router.get('/redis/info', adminController.getRedisInfo);
router.post('/redis/clear-pattern', adminController.clearCacheByPattern);

export default router;

