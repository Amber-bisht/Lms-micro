import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';

const router = Router();

// YouTube routes
router.get('/youtube/video/:videoId', mediaController.getYouTubeVideo);
router.get('/youtube/search', mediaController.searchYouTube);

// Dailymotion routes
router.get('/dailymotion/video/:videoId', mediaController.getDailymotionVideo);
router.get('/dailymotion/search', mediaController.searchDailymotion);

// General routes
router.get('/embed/:platform/:videoId', mediaController.getVideoEmbed);

export default router;

