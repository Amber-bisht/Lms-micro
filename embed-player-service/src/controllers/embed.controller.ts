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

// Get embed player HTML for a video
export const getEmbedPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoUrl, autoplay = false, controls = true, start, end, loop = false, mute = false } = req.query;

    if (!videoUrl || typeof videoUrl !== 'string') {
      res.status(400).json({ message: 'Video URL is required' });
      return;
    }

    // Check if it's a valid YouTube URL
    if (!isValidYouTubeUrl(videoUrl)) {
      res.status(400).json({ message: 'Only YouTube URLs are supported' });
      return;
    }

    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      res.status(400).json({ message: 'Invalid YouTube URL' });
      return;
    }

    const embedUrl = generateYouTubeEmbedUrl(videoId, {
      autoplay: autoplay === 'true',
      controls: controls === 'true',
      start: start ? parseInt(start as string) : undefined,
      end: end ? parseInt(end as string) : undefined,
      loop: loop === 'true',
      mute: mute === 'true'
    });

    const thumbnail = generateYouTubeThumbnail(videoId);

    const embedHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Video Player</title>
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
        </style>
      </head>
      <body>
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

// Get video information
export const getVideoInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoUrl } = req.query;

    if (!videoUrl || typeof videoUrl !== 'string') {
      res.status(400).json({ message: 'Video URL is required' });
      return;
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      res.status(400).json({ message: 'Only YouTube URLs are supported' });
      return;
    }

    const videoInfo = getYouTubeVideoInfo(videoUrl);
    if (!videoInfo) {
      res.status(400).json({ message: 'Invalid YouTube URL' });
      return;
    }

    res.status(200).json(videoInfo);
  } catch (error) {
    logger.error('Error getting video info:', error);
    res.status(500).json({ message: 'Error getting video info' });
  }
};

// Get embed URL for iframe
export const getEmbedUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoUrl, autoplay = false, controls = true, start, end, loop = false, mute = false } = req.query;

    if (!videoUrl || typeof videoUrl !== 'string') {
      res.status(400).json({ message: 'Video URL is required' });
      return;
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      res.status(400).json({ message: 'Only YouTube URLs are supported' });
      return;
    }

    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      res.status(400).json({ message: 'Invalid YouTube URL' });
      return;
    }

    const embedUrl = generateYouTubeEmbedUrl(videoId, {
      autoplay: autoplay === 'true',
      controls: controls === 'true',
      start: start ? parseInt(start as string) : undefined,
      end: end ? parseInt(end as string) : undefined,
      loop: loop === 'true',
      mute: mute === 'true'
    });

    res.status(200).json({ embedUrl, videoId });
  } catch (error) {
    logger.error('Error generating embed URL:', error);
    res.status(500).json({ message: 'Error generating embed URL' });
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
