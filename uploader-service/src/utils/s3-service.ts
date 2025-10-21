import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/config';
import { logger } from './logger';

class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = config.S3_BUCKET_NAME;
    
    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME is required when USE_S3 is true');
    }

    // Initialize S3 client
    const s3Config: any = {
      region: config.S3_BUCKET_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
    };

    // Add custom endpoint if provided (for S3-compatible services like MinIO)
    if (config.S3_ENDPOINT) {
      s3Config.endpoint = config.S3_ENDPOINT;
      s3Config.forcePathStyle = true; // Required for some S3-compatible services
    }

    this.s3Client = new S3Client(s3Config);
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);
      
      // Generate the public URL
      const url = this.getPublicUrl(key);
      logger.info(`File uploaded to S3: ${key}`);
      
      return url;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a presigned URL for direct uploads
   */
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      logger.error('S3 presigned URL generation error:', error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a presigned URL for downloads
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      logger.error('S3 presigned download URL generation error:', error);
      throw new Error(`Failed to generate presigned download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the public URL for a file
   */
  getPublicUrl(key: string): string {
    if (config.S3_ENDPOINT) {
      // For custom S3-compatible services
      return `${config.S3_ENDPOINT}/${this.bucketName}/${key}`;
    } else {
      // For AWS S3
      return `https://${this.bucketName}.s3.${config.S3_BUCKET_REGION}.amazonaws.com/${key}`;
    }
  }

  /**
   * Generate a unique key for a file
   */
  generateKey(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `uploads/${userId}/${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Generate a thumbnail key
   */
  generateThumbnailKey(originalKey: string): string {
    const pathParts = originalKey.split('/');
    const filename = pathParts[pathParts.length - 1];
    const nameWithoutExt = filename.split('.')[0];
    const extension = filename.split('.').pop();
    pathParts[pathParts.length - 1] = `thumb-${nameWithoutExt}.${extension}`;
    return pathParts.join('/');
  }
}

// Export singleton instance
export const s3Service = new S3Service();
export default s3Service;
