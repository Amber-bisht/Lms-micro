import { Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import config from '../config/config';

export const mediaController = {
  async getYouTubeVideo(req: Request, res: Response) {
    try {
      const { videoId } = req.params;
      
      if (!config.YOUTUBE_API_KEY) {
        return res.status(503).json({ error: 'YouTube API key not configured' });
      }

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet,contentDetails,statistics',
            id: videoId,
            key: config.YOUTUBE_API_KEY
          }
        }
      );

      if (!response.data.items || response.data.items.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const video = response.data.items[0];
      res.json({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount
      });
    } catch (error) {
      logger.error('Error fetching YouTube video:', error);
      res.status(500).json({ error: 'Failed to fetch YouTube video' });
    }
  },

  async searchYouTube(req: Request, res: Response) {
    try {
      const { query, maxResults = 10 } = req.query;

      if (!config.YOUTUBE_API_KEY) {
        return res.status(503).json({ error: 'YouTube API key not configured' });
      }

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            q: query,
            maxResults,
            type: 'video',
            key: config.YOUTUBE_API_KEY
          }
        }
      );

      const videos = response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt
      }));

      res.json(videos);
    } catch (error) {
      logger.error('Error searching YouTube:', error);
      res.status(500).json({ error: 'Failed to search YouTube' });
    }
  },

  async getDailymotionVideo(req: Request, res: Response) {
    try {
      const { videoId } = req.params;

      const response = await axios.get(
        `https://api.dailymotion.com/video/${videoId}`,
        {
          params: {
            fields: 'id,title,description,thumbnail_url,duration,views_total,created_time'
          }
        }
      );

      res.json({
        id: response.data.id,
        title: response.data.title,
        description: response.data.description,
        thumbnail: response.data.thumbnail_url,
        duration: response.data.duration,
        views: response.data.views_total,
        createdAt: response.data.created_time
      });
    } catch (error) {
      logger.error('Error fetching Dailymotion video:', error);
      res.status(500).json({ error: 'Failed to fetch Dailymotion video' });
    }
  },

  async searchDailymotion(req: Request, res: Response) {
    try {
      const { query, limit = 10 } = req.query;

      const response = await axios.get(
        `https://api.dailymotion.com/videos`,
        {
          params: {
            search: query,
            limit,
            fields: 'id,title,description,thumbnail_url,duration,created_time'
          }
        }
      );

      const videos = response.data.list.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail_url,
        duration: item.duration,
        createdAt: item.created_time
      }));

      res.json(videos);
    } catch (error) {
      logger.error('Error searching Dailymotion:', error);
      res.status(500).json({ error: 'Failed to search Dailymotion' });
    }
  },

  async getVideoEmbed(req: Request, res: Response) {
    try {
      const { platform, videoId } = req.params;

      let embedUrl = '';
      if (platform === 'youtube') {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (platform === 'dailymotion') {
        embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
      } else {
        return res.status(400).json({ error: 'Invalid platform' });
      }

      res.json({ embedUrl });
    } catch (error) {
      logger.error('Error generating embed URL:', error);
      res.status(500).json({ error: 'Failed to generate embed URL' });
    }
  }
};

