import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { logger } from './logger';

export interface HLSConversionResult {
  hls720Url?: string;
  hls720S3Key?: string;
  hls1080Url?: string;
  hls1080S3Key?: string;
  duration?: number;
}

/**
 * Convert MP4 to HLS format with multiple qualities
 */
export async function convertToHLS(
  inputPath: string,
  outputDir: string,
  outputFileName: string,
  userId: string
): Promise<HLSConversionResult> {
  
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const hls720Path = path.join(outputDir, `${outputFileName}-720p.m3u8`);
  const hls1080Path = path.join(outputDir, `${outputFileName}-1080p.m3u8`);

  try {
    // Get video duration first
    const duration = await getVideoDuration(inputPath);
    
    logger.info(`Converting video to HLS: ${inputPath}`);
    logger.info(`Duration: ${duration} seconds`);

    // Convert to 720p HLS
    await convertToHLSQuality(inputPath, hls720Path, 720);
    
    // Convert to 1080p HLS
    await convertToHLSQuality(inputPath, hls1080Path, 1080);

    return {
      hls720Url: `/uploads/videos/${userId}/${outputFileName}-720p.m3u8`,
      hls720S3Key: `videos/${userId}/${outputFileName}-720p.m3u8`,
      hls1080Url: `/uploads/videos/${userId}/${outputFileName}-1080p.m3u8`,
      hls1080S3Key: `videos/${userId}/${outputFileName}-1080p.m3u8`,
      duration,
    };
  } catch (error) {
    logger.error('HLS conversion error:', error);
    throw error;
  }
}

/**
 * Get video duration in seconds
 */
function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err: any, metadata: any) => {
      if (err) {
        logger.error('Error getting video duration:', err);
        resolve(0); // Default to 0 if can't get duration
        return;
      }
      
      const duration = metadata.format.duration || 0;
      resolve(Math.floor(duration));
    });
  });
}

/**
 * Convert video to HLS with specific quality
 */
function convertToHLSQuality(
  inputPath: string,
  outputPath: string,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264', // Video codec
        '-c:a aac', // Audio codec
        '-ac 2', // Stereo audio
        '-ab 128k', // Audio bitrate
        '-movflags faststart', // Optimize for streaming
        '-sc_threshold 0', // Disable scene detection
        '-g 48', // Keyframe every 48 frames (2 seconds at 24fps)
        '-keyint_min 48', // Minimum keyframe interval
        '-hls_time 2', // 2 second segments
        '-hls_list_size 0', // Keep all segments in playlist
        '-hls_segment_filename', `${outputPath.replace('.m3u8', '')}_%03d.ts`, // Segment filename
      ])
      .size(`?x${height}`) // Set height, preserve aspect ratio
      .videoBitrate(height === 720 ? '2000k' : '4000k') // Bitrate based on quality
      .on('start', (commandLine: string) => {
        logger.info(`FFmpeg started for ${height}p: ${commandLine}`);
      })
      .on('progress', (progress: any) => {
        logger.info(`Processing ${height}p: ${progress.percent}% done`);
      })
      .on('end', () => {
        logger.info(`HLS conversion completed for ${height}p`);
        resolve();
      })
      .on('error', (err: any) => {
        logger.error(`FFmpeg error for ${height}p:`, err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timestamp: string = '00:00:01'
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '320x180'
      })
      .on('end', () => {
        logger.info('Thumbnail generated:', outputPath);
        resolve();
      })
      .on('error', (err: any) => {
        logger.error('Thumbnail generation error:', err);
        reject(err);
      });
  });
}

