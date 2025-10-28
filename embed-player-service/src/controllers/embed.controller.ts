import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { 
  extractYouTubeVideoId, 
  generateYouTubeEmbedUrl, 
  generateYouTubeThumbnail,
  isValidYouTubeUrl,
  getYouTubeVideoInfo,
  YouTubeVideoInfo 
} from '../utils/youtube-utils';
import VideoSession from '../models/VideoSession';
import config from '../config/config';
import crypto from 'crypto';

// Generate a secure token for video session
const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Create a new video session with token
export const createVideoSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId, courseId, userId } = req.body;

    if (!videoId || !courseId || !userId) {
      res.status(400).json({ 
        message: 'videoId, courseId, and userId are required' 
      });
      return;
    }

    // Validate YouTube video ID
    if (!isValidYouTubeUrl(`https://www.youtube.com/watch?v=${videoId}`)) {
      res.status(400).json({ 
        message: 'Invalid YouTube video ID' 
      });
      return;
    }

    // Generate token and embed URL
    const token = generateToken();
    const embedUrl = generateYouTubeEmbedUrl(videoId, {
      autoplay: false,
      controls: true,
      rel: 0,
      modestbranding: 1,
      fs: 1
    });

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create video session
    const videoSession = new VideoSession({
      videoId,
      courseId,
      userId,
      token,
      embedUrl,
      expiresAt,
      isActive: true
    });

    await videoSession.save();

    logger.info(`Video session created: ${videoId} for course ${courseId} by user ${userId}`);

    res.status(201).json({
      success: true,
      token,
      embedUrl,
      expiresAt,
      sessionId: videoSession._id
    });
  } catch (error) {
    logger.error('Error creating video session:', error);
    res.status(500).json({ message: 'Error creating video session' });
  }
};

// Get video session by token
export const getVideoSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const videoSession = await VideoSession.findOne({ 
      token, 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!videoSession) {
      res.status(404).json({ 
        message: 'Video session not found or expired' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      videoId: videoSession.videoId,
      courseId: videoSession.courseId,
      userId: videoSession.userId,
      embedUrl: videoSession.embedUrl,
      expiresAt: videoSession.expiresAt,
      isActive: videoSession.isActive
    });
  } catch (error) {
    logger.error('Error getting video session:', error);
    res.status(500).json({ message: 'Error getting video session' });
  }
};

// Get embed player HTML using token
export const getEmbedPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { autoplay = false, controls = true, start, end, loop = false, mute = false } = req.query;

    const videoSession = await VideoSession.findOne({ 
      token, 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!videoSession) {
      res.status(404).json({ 
        message: 'Video session not found or expired' 
      });
      return;
    }

    // Generate embed URL with custom parameters
    const embedUrl = generateYouTubeEmbedUrl(videoSession.videoId, {
      autoplay: autoplay === 'true',
      controls: controls === 'true',
      start: start ? parseInt(start as string) : undefined,
      end: end ? parseInt(end as string) : undefined,
      loop: loop === 'true',
      mute: mute === 'true'
    });

    const embedHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Video Player - Course ${videoSession.courseId}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
          }
          .player-container {
            position: relative;
            width: 100%;
            max-width: 1280px;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            background: #000;
          }
          .player-container iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 18px;
          }
          .session-info {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
          }
        </style>
      </head>
      <body>
        <div class="session-info">
          Course: ${videoSession.courseId} | Video: ${videoSession.videoId}
        </div>
        <div class="player-container">
          <div class="loading" id="loading">Loading video...</div>
          <iframe 
            src="${embedUrl}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            onload="document.getElementById('loading').style.display='none'"
          ></iframe>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(embedHtml);
  } catch (error) {
    logger.error('Error generating embed player:', error);
    res.status(500).json({ message: 'Error generating embed player' });
  }
};

// Get video information by token
export const getVideoInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const videoSession = await VideoSession.findOne({ 
      token, 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!videoSession) {
      res.status(404).json({ 
        message: 'Video session not found or expired' 
      });
      return;
    }

    const videoInfo = getYouTubeVideoInfo(`https://www.youtube.com/watch?v=${videoSession.videoId}`);
    
    res.status(200).json({
      success: true,
      videoId: videoSession.videoId,
      courseId: videoSession.courseId,
      embedUrl: videoSession.embedUrl,
      thumbnail: generateYouTubeThumbnail(videoSession.videoId),
      expiresAt: videoSession.expiresAt,
      ...videoInfo
    });
  } catch (error) {
    logger.error('Error getting video info:', error);
    res.status(500).json({ message: 'Error getting video info' });
  }
};

// Deactivate video session
export const deactivateVideoSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { userId } = req.body;

    const videoSession = await VideoSession.findOne({ 
      token, 
      userId,
      isActive: true 
    });

    if (!videoSession) {
      res.status(404).json({ 
        message: 'Video session not found' 
      });
      return;
    }

    videoSession.isActive = false;
    await videoSession.save();

    logger.info(`Video session deactivated: ${token} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Video session deactivated successfully'
    });
  } catch (error) {
    logger.error('Error deactivating video session:', error);
    res.status(500).json({ message: 'Error deactivating video session' });
  }
};

// Get user's active video sessions
export const getUserVideoSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const videoSessions = await VideoSession.find({ 
      userId, 
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sessions: videoSessions.map(session => ({
        sessionId: session._id,
        videoId: session.videoId,
        courseId: session.courseId,
        token: session.token,
        embedUrl: session.embedUrl,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    logger.error('Error getting user video sessions:', error);
    res.status(500).json({ message: 'Error getting user video sessions' });
  }
};

// Health check
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'embed-player-service',
    timestamp: new Date().toISOString()
  });
};