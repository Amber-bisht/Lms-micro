import s3Service from './s3-service';
import { logger } from './logger';

/**
 * Parse an HLS playlist and replace all .ts segment paths with presigned URLs
 */
export async function signPlaylistSegments(
  playlistContent: string,
  s3KeyPrefix: string,
  expiresIn: number = 7200
): Promise<string> {
  try {
    const lines = playlistContent.split('\n');
    const signedLines: string[] = [];

    for (const line of lines) {
      // Check if line is a .ts segment reference
      if (line.trim().endsWith('.ts')) {
        // Extract just the filename
        const filename = line.trim().split('/').pop();
        
        // Construct the full S3 key
        const s3Key = `${s3KeyPrefix}/${filename}`;
        
        // Generate presigned URL for this segment
        const presignedUrl = await s3Service.generatePresignedDownloadUrl(s3Key, expiresIn);
        
        signedLines.push(presignedUrl);
        logger.info(`Signed segment: ${filename}`);
      } else {
        // Keep the line as-is (comments, metadata, etc.)
        signedLines.push(line);
      }
    }

    return signedLines.join('\n');
  } catch (error) {
    logger.error('Error signing playlist segments:', error);
    throw error;
  }
}

/**
 * Fetch playlist from S3, sign all segments, and return modified content
 */
export async function getSignedPlaylistFromS3(
  playlistS3Key: string,
  expiresIn: number = 7200
): Promise<string> {
  try {
    // Get the directory path from the playlist key
    const s3KeyPrefix = playlistS3Key.substring(0, playlistS3Key.lastIndexOf('/'));
    
    // Generate presigned URL for the playlist itself
    const playlistPresignedUrl = await s3Service.generatePresignedDownloadUrl(playlistS3Key, expiresIn);
    
    // Fetch the playlist content
    const response = await fetch(playlistPresignedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status}`);
    }
    
    const playlistContent = await response.text();
    logger.info(`Fetched playlist from S3: ${playlistS3Key}`);
    
    // Sign all segment URLs in the playlist
    const signedPlaylist = await signPlaylistSegments(playlistContent, s3KeyPrefix, expiresIn);
    
    return signedPlaylist;
  } catch (error) {
    logger.error('Error getting signed playlist from S3:', error);
    throw error;
  }
}

