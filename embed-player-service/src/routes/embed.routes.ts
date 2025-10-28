import { Router } from 'express';
import { 
  createVideoSession,
  getVideoSession,
  getEmbedPlayer, 
  getVideoInfo, 
  deactivateVideoSession,
  getUserVideoSessions,
  healthCheck 
} from '../controllers/embed.controller';

const router = Router();

// Health check
router.get('/health', healthCheck);

// Create a new video session
router.post('/session', createVideoSession);

// Get video session by token
router.get('/session/:token', getVideoSession);

// Get embed player HTML using token
router.get('/player/:token', getEmbedPlayer);

// Get video information by token
router.get('/info/:token', getVideoInfo);

// Deactivate video session
router.put('/session/:token/deactivate', deactivateVideoSession);

// Get user's active video sessions
router.get('/user/:userId/sessions', getUserVideoSessions);

export default router;
