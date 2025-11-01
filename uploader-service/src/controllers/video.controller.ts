import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import Video from '../models/Video';
import { logger } from '../utils/logger';
import { videoQueue } from '../utils/video-queue';
import s3Service from '../utils/s3-service';
import config from '../config/config';
import { getSignedPlaylistFromS3 } from '../utils/playlist-signer';

// Upload video file (MP4)
export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No video file uploaded' });
      return;
    }

    const userId = (req as any).userId || 'anonymous';
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Video title is required' });
      return;
    }

    // Check if file is MP4
    if (!req.file.mimetype.startsWith('video/') || !req.file.originalname.endsWith('.mp4')) {
      res.status(400).json({ message: 'Only MP4 video files are allowed' });
      return;
    }

    // Create video record
    const videoDoc = new Video({
      userId,
      title,
      originalFilename: req.file.originalname,
      originalSize: req.file.size,
      originalMimetype: req.file.mimetype,
      status: 'pending',
      videoType: 'upload',
      storageType: config.USE_S3 ? 's3' : 'local',
    });

    await videoDoc.save();

    logger.info(`Video record created: ${videoDoc._id}`);

    // Add to processing queue
    const jobData = {
      videoId: videoDoc._id.toString(),
      inputPath: req.file.path,
      userId,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      storageType: config.USE_S3 ? 's3' : 'local' as 'local' | 's3',
    };

    // If using S3, upload original file first
    if (config.USE_S3) {
      try {
        const fileBuffer = await fs.readFile(req.file.path);
        const s3Key = `videos/original/${userId}/${req.file.filename}`;
        const originalUrl = await s3Service.uploadFile(
          s3Key,
          fileBuffer,
          req.file.mimetype
        );
        
        videoDoc.originalUrl = originalUrl;
        videoDoc.originalS3Key = s3Key;
        videoDoc.s3Bucket = config.S3_BUCKET_NAME;
        await videoDoc.save();
      } catch (error) {
        logger.error('S3 upload error:', error);
      }
    }

    await videoQueue.add('process-video', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    logger.info(`Video processing job queued: ${videoDoc._id}`);

    res.status(201).json({
      message: 'Video uploaded successfully. Processing in background.',
      video: {
        id: videoDoc._id,
        title: videoDoc.title,
        status: videoDoc.status,
        uploadedAt: videoDoc.uploadedAt,
      },
    });
  } catch (error) {
    logger.error('Video upload error:', error);
    res.status(500).json({ message: 'Error uploading video' });
  }
};

// Upload external HLS link
export const uploadExternalHLS = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { title, hlsUrl } = req.body;

    if (!title || !hlsUrl) {
      res.status(400).json({ message: 'Title and HLS URL are required' });
      return;
    }

    // Validate HLS URL format
    if (!hlsUrl.match(/\.m3u8$/i)) {
      res.status(400).json({ message: 'Invalid HLS URL. Must be a .m3u8 file' });
      return;
    }

    const videoDoc = new Video({
      userId,
      title,
      originalFilename: 'external-hls',
      originalSize: 0,
      originalMimetype: 'application/vnd.apple.mpegurl',
      status: 'completed',
      videoType: 'external-hls',
      externalHlsUrl: hlsUrl,
      storageType: 'local',
    });

    await videoDoc.save();

    logger.info(`External HLS video created: ${videoDoc._id}`);

    res.status(201).json({
      message: 'External HLS video added successfully',
      video: {
        id: videoDoc._id,
        title: videoDoc.title,
        externalHlsUrl: videoDoc.externalHlsUrl,
        status: videoDoc.status,
      },
    });
  } catch (error) {
    logger.error('External HLS upload error:', error);
    res.status(500).json({ message: 'Error adding external HLS video' });
  }
};

// Add YouTube link
export const addYouTubeVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { title, youtubeUrl } = req.body;

    if (!title || !youtubeUrl) {
      res.status(400).json({ message: 'Title and YouTube URL are required' });
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    if (!youtubeUrl.match(youtubeRegex)) {
      res.status(400).json({ message: 'Invalid YouTube URL' });
      return;
    }

    const videoDoc = new Video({
      userId,
      title,
      originalFilename: 'youtube-video',
      originalSize: 0,
      originalMimetype: 'video/youtube',
      status: 'completed',
      videoType: 'youtube',
      youtubeUrl,
      storageType: 'local',
    });

    await videoDoc.save();

    logger.info(`YouTube video added: ${videoDoc._id}`);

    res.status(201).json({
      message: 'YouTube video added successfully',
      video: {
        id: videoDoc._id,
        title: videoDoc.title,
        youtubeUrl: videoDoc.youtubeUrl,
        status: videoDoc.status,
      },
    });
  } catch (error) {
    logger.error('YouTube video addition error:', error);
    res.status(500).json({ message: 'Error adding YouTube video' });
  }
};

// Get all videos for a user
export const getUserVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId || (req as any).userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User ID required' });
      return;
    }

    const videos = await Video.find({ userId }).sort({ uploadedAt: -1 });
    
    res.status(200).json(videos);
  } catch (error) {
    logger.error('Get user videos error:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

// Get video by ID
export const getVideoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // For S3-stored videos, return the signed playlist endpoint URL
    const videoResponse: any = video.toObject();
    
    if (video.storageType === 's3') {
      try {
        // For HLS videos, point to our signed playlist endpoint
        // This endpoint will serve the playlist with all .ts segments signed
        const baseUrl = config.UPLOADER_SERVICE_URL || `http://localhost:${config.PORT}`;
        
        if (video.hls720S3Key) {
          videoResponse.hls720Url = `${baseUrl}/api/videos/${video._id}/playlist.m3u8`;
          logger.info(`Set signed playlist URL for 720p: ${video._id}`);
        }
        
        if (video.hls1080S3Key) {
          videoResponse.hls1080Url = `${baseUrl}/api/videos/${video._id}/playlist.m3u8`;
          logger.info(`Set signed playlist URL for 1080p: ${video._id}`);
        }
        
        // Generate presigned URL for original file (direct download)
        if (video.originalS3Key) {
          const presignedUrlOriginal = await s3Service.generatePresignedDownloadUrl(
            video.originalS3Key,
            7200 // 2 hours
          );
          videoResponse.originalUrl = presignedUrlOriginal;
        }
      } catch (s3Error) {
        logger.error('Error generating URLs:', s3Error);
        // Continue with original URLs if generation fails
      }
    }

    res.status(200).json(videoResponse);
  } catch (error) {
    logger.error('Get video by ID error:', error);
    res.status(500).json({ message: 'Error fetching video' });
  }
};

// Get signed HLS playlist with presigned URLs for all segments
export const getSignedPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Only works for S3-stored videos
    if (video.storageType !== 's3') {
      res.status(400).json({ message: 'This endpoint only works for S3-stored videos' });
      return;
    }

    // Determine which quality playlist to serve (prefer 1080p, fallback to 720p)
    let playlistS3Key: string | undefined;
    
    if (video.hls1080S3Key) {
      playlistS3Key = video.hls1080S3Key;
    } else if (video.hls720S3Key) {
      playlistS3Key = video.hls720S3Key;
    }

    if (!playlistS3Key) {
      res.status(404).json({ message: 'No HLS playlist found for this video' });
      return;
    }

    // Get the signed playlist with all segments signed
    const signedPlaylistContent = await getSignedPlaylistFromS3(playlistS3Key, 7200);

    // Set appropriate headers for HLS playlist
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    res.status(200).send(signedPlaylistContent);
    logger.info(`Served signed playlist for video: ${id}`);
  } catch (error) {
    logger.error('Get signed playlist error:', error);
    res.status(500).json({ message: 'Error generating signed playlist' });
  }
};

// Delete video
export const deleteVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const video = await Video.findById(id);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Check if user is owner
    if (video.userId !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Delete physical files if video type is upload
    if (video.videoType === 'upload') {
      // Delete HLS files
      if (video.storageType === 's3') {
        // Delete from S3
        if (video.hls720S3Key) await s3Service.deleteFile(video.hls720S3Key).catch(() => {});
        if (video.hls1080S3Key) await s3Service.deleteFile(video.hls1080S3Key).catch(() => {});
        if (video.originalS3Key) await s3Service.deleteFile(video.originalS3Key).catch(() => {});
      } else {
        // Delete local files (TODO: implement if needed)
        logger.info('Local file cleanup would happen here');
      }
    }

    await Video.findByIdAndDelete(id);

    logger.info(`Video deleted: ${video._id} by user ${userId}`);
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    logger.error('Delete video error:', error);
    res.status(500).json({ message: 'Error deleting video' });
  }
};

// Get all videos (for admin)
export const getAllVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const videos = await Video.find().sort({ uploadedAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    logger.error('Get all videos error:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

// Update video processing status (called by job processor)
export const updateVideoStatus = async (
  videoId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  data?: any,
  error?: string
): Promise<void> => {
  try {
    const updateData: any = { status };
    
    if (status === 'completed' && data) {
      updateData.hls720Url = data.hls720Url;
      updateData.hls720S3Key = data.hls720S3Key;
      updateData.hls1080Url = data.hls1080Url;
      updateData.hls1080S3Key = data.hls1080S3Key;
      updateData.duration = data.duration;
      updateData.thumbnail = data.thumbnail;
      updateData.processedAt = new Date();
    }
    
    if (status === 'failed' && error) {
      updateData.processingError = error;
    }

    await Video.findByIdAndUpdate(videoId, updateData);
    logger.info(`Video ${videoId} status updated to ${status}`);
  } catch (error) {
    logger.error('Update video status error:', error);
  }
};

