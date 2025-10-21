import { Router } from 'express';
import { 
  getEmbedPlayer, 
  getVideoInfo, 
  getEmbedUrl, 
  healthCheck 
} from '../controllers/embed.controller';

const router = Router();

// Health check
router.get('/health', healthCheck);

// Get embed player HTML
router.get('/player', getEmbedPlayer);

// Get video information
router.get('/info', getVideoInfo);

// Get embed URL for iframe
router.get('/url', getEmbedUrl);

export default router;
