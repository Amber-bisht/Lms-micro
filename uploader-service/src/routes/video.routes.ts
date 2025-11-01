import { Router } from 'express';
import * as videoController from '../controllers/video.controller';
import { videoUpload } from '../middleware/upload.middleware';

const router = Router();

// Upload video file (MP4)
router.post('/upload', videoUpload.single('video'), videoController.uploadVideo);

// Add external HLS link
router.post('/external-hls', videoController.uploadExternalHLS);

// Add YouTube link
router.post('/youtube', videoController.addYouTubeVideo);

// Get user's videos
router.get('/user/:userId', videoController.getUserVideos);

// Get video by ID
router.get('/:id', videoController.getVideoById);

// Stream HLS playlist with presigned URLs (for private S3 videos)
router.get('/:id/playlist.m3u8', videoController.getSignedPlaylist);

// Delete video
router.delete('/:id', videoController.deleteVideo);

// Get all videos (admin)
router.get('/', videoController.getAllVideos);

export default router;

