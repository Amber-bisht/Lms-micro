import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import File from '../models/File';
import { logger } from '../utils/logger';
import config from '../config/config';
import s3Service from '../utils/s3-service';

// Upload single file
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const userId = (req as any).userId || 'anonymous';
    const { isPublic } = req.body;

    let fileUrl: string;
    let thumbnailUrl: string | undefined;
    let s3Key: string | undefined;
    let s3Bucket: string | undefined;
    let storageType: 'local' | 's3' = 'local';

    if (config.USE_S3) {
      // Upload to S3
      try {
        s3Key = s3Service.generateKey(req.file.originalname, userId);
        s3Bucket = config.S3_BUCKET_NAME;
        storageType = 's3';

        // Read file buffer
        const fileBuffer = await fs.readFile(req.file.path);
        
        // Upload main file to S3
        fileUrl = await s3Service.uploadFile(
          s3Key,
          fileBuffer,
          req.file.mimetype,
          {
            originalName: req.file.originalname,
            userId: userId,
            uploadedAt: new Date().toISOString(),
          }
        );

        // Generate thumbnail for images
        if (req.file.mimetype.startsWith('image/')) {
          try {
            const thumbnailBuffer = await sharp(req.file.path)
              .resize(200, 200, { fit: 'inside' })
              .toBuffer();

            const thumbnailKey = s3Service.generateThumbnailKey(s3Key);
            thumbnailUrl = await s3Service.uploadFile(
              thumbnailKey,
              thumbnailBuffer,
              req.file.mimetype
            );
          } catch (error) {
            logger.error('Error generating thumbnail:', error);
          }
        }

        // Clean up local file
        await fs.unlink(req.file.path);
        
      } catch (error) {
        logger.error('S3 upload error:', error);
        // Fallback to local storage
        const baseUrl = config.CDN_URL || `http://localhost:${config.PORT}`;
        fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
        storageType = 'local';
      }
    } else {
      // Local storage
      const baseUrl = config.CDN_URL || `http://localhost:${config.PORT}`;
      fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

      // Generate thumbnail for images
      if (req.file.mimetype.startsWith('image/')) {
        try {
          const thumbnailFilename = `thumb-${req.file.filename}`;
          const thumbnailPath = path.join(config.UPLOAD_DIR, thumbnailFilename);
          
          await sharp(req.file.path)
            .resize(200, 200, { fit: 'inside' })
            .toFile(thumbnailPath);

          thumbnailUrl = `${baseUrl}/uploads/${thumbnailFilename}`;
        } catch (error) {
          logger.error('Error generating thumbnail:', error);
        }
      }
    }

    // Save file metadata to database
    const fileDoc = new File({
      userId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: fileUrl,
      thumbnail: thumbnailUrl,
      isPublic: isPublic === 'true' || isPublic === true,
      s3Key,
      s3Bucket,
      storageType,
    });

    await fileDoc.save();

    logger.info(`File uploaded: ${req.file.filename} by user ${userId} (${storageType})`);
    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: fileDoc._id,
        originalName: fileDoc.originalName,
        filename: fileDoc.filename,
        mimetype: fileDoc.mimetype,
        size: fileDoc.size,
        url: fileDoc.url,
        thumbnail: fileDoc.thumbnail,
        storageType: fileDoc.storageType,
        uploadedAt: fileDoc.uploadedAt,
      },
    });
  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }

    const userId = (req as any).userId || 'anonymous';
    const { isPublic } = req.body;

    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        let fileUrl: string;
        let thumbnailUrl: string | undefined;
        let s3Key: string | undefined;
        let s3Bucket: string | undefined;
        let storageType: 'local' | 's3' = 'local';

        if (config.USE_S3) {
          // Upload to S3
          try {
            s3Key = s3Service.generateKey(file.originalname, userId);
            s3Bucket = config.S3_BUCKET_NAME;
            storageType = 's3';

            // Read file buffer
            const fileBuffer = await fs.readFile(file.path);
            
            // Upload main file to S3
            fileUrl = await s3Service.uploadFile(
              s3Key,
              fileBuffer,
              file.mimetype,
              {
                originalName: file.originalname,
                userId: userId,
                uploadedAt: new Date().toISOString(),
              }
            );

            // Generate thumbnail for images
            if (file.mimetype.startsWith('image/')) {
              try {
                const thumbnailBuffer = await sharp(file.path)
                  .resize(200, 200, { fit: 'inside' })
                  .toBuffer();

                const thumbnailKey = s3Service.generateThumbnailKey(s3Key);
                thumbnailUrl = await s3Service.uploadFile(
                  thumbnailKey,
                  thumbnailBuffer,
                  file.mimetype
                );
              } catch (error) {
                logger.error('Error generating thumbnail:', error);
              }
            }

            // Clean up local file
            await fs.unlink(file.path);
            
          } catch (error) {
            logger.error('S3 upload error:', error);
            // Fallback to local storage
            const baseUrl = config.CDN_URL || `http://localhost:${config.PORT}`;
            fileUrl = `${baseUrl}/uploads/${file.filename}`;
            storageType = 'local';
          }
        } else {
          // Local storage
          const baseUrl = config.CDN_URL || `http://localhost:${config.PORT}`;
          fileUrl = `${baseUrl}/uploads/${file.filename}`;

          // Generate thumbnail for images
          if (file.mimetype.startsWith('image/')) {
            try {
              const thumbnailFilename = `thumb-${file.filename}`;
              const thumbnailPath = path.join(config.UPLOAD_DIR, thumbnailFilename);
              
              await sharp(file.path)
                .resize(200, 200, { fit: 'inside' })
                .toFile(thumbnailPath);

              thumbnailUrl = `${baseUrl}/uploads/${thumbnailFilename}`;
            } catch (error) {
              logger.error('Error generating thumbnail:', error);
            }
          }
        }

        const fileDoc = new File({
          userId,
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: fileUrl,
          thumbnail: thumbnailUrl,
          isPublic: isPublic === 'true' || isPublic === true,
          s3Key,
          s3Bucket,
          storageType,
        });

        await fileDoc.save();

        return {
          id: fileDoc._id,
          originalName: fileDoc.originalName,
          filename: fileDoc.filename,
          mimetype: fileDoc.mimetype,
          size: fileDoc.size,
          url: fileDoc.url,
          thumbnail: fileDoc.thumbnail,
          storageType: fileDoc.storageType,
          uploadedAt: fileDoc.uploadedAt,
        };
      })
    );

    logger.info(`${uploadedFiles.length} files uploaded by user ${userId}`);
    res.status(201).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    });
  } catch (error) {
    logger.error('Multiple file upload error:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
};

// Get user's files
export const getUserFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId || (req as any).userId;
    if (!userId) {
      res.status(401).json({ message: 'User ID required' });
      return;
    }

    const files = await File.find({ userId }).sort({ uploadedAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    logger.error('Get user files error:', error);
    res.status(500).json({ message: 'Error fetching files' });
  }
};

// Get file by ID
export const getFileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const file = await File.findById(id);

    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    // Check if user has access (public or owner)
    const userId = (req as any).userId;
    if (!file.isPublic && file.userId !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.status(200).json(file);
  } catch (error) {
    logger.error('Get file by ID error:', error);
    res.status(500).json({ message: 'Error fetching file' });
  }
};

// Delete file
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const file = await File.findById(id);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    // Check if user is owner
    if (file.userId !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Delete physical file
    try {
      if (file.storageType === 's3' && file.s3Key) {
        // Delete from S3
        await s3Service.deleteFile(file.s3Key);
        
        // Delete thumbnail from S3 if exists
        if (file.thumbnail && file.s3Key) {
          const thumbnailKey = s3Service.generateThumbnailKey(file.s3Key);
          await s3Service.deleteFile(thumbnailKey).catch(() => {});
        }
      } else {
        // Delete from local storage
        await fs.unlink(file.path);
        // Delete thumbnail if exists
        if (file.thumbnail) {
          const thumbnailPath = path.join(config.UPLOAD_DIR, `thumb-${file.filename}`);
          await fs.unlink(thumbnailPath).catch(() => {});
        }
      }
    } catch (error) {
      logger.error('Error deleting physical file:', error);
    }

    // Delete from database
    await File.findByIdAndDelete(id);

    logger.info(`File deleted: ${file.filename} by user ${userId} (${file.storageType})`);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
};

// Generate presigned URL for direct upload
export const generatePresignedUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!config.USE_S3) {
      res.status(400).json({ message: 'S3 is not enabled' });
      return;
    }

    const userId = (req as any).userId || 'anonymous';
    const { filename, mimetype } = req.body;

    if (!filename || !mimetype) {
      res.status(400).json({ message: 'Filename and mimetype are required' });
      return;
    }

    const s3Key = s3Service.generateKey(filename, userId);
    const presignedUrl = await s3Service.generatePresignedUploadUrl(s3Key, mimetype);

    res.status(200).json({
      presignedUrl,
      s3Key,
      publicUrl: s3Service.getPublicUrl(s3Key),
    });
  } catch (error) {
    logger.error('Generate presigned URL error:', error);
    res.status(500).json({ message: 'Error generating presigned URL' });
  }
};

// Generate presigned URL for download
export const generatePresignedDownloadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!config.USE_S3) {
      res.status(400).json({ message: 'S3 is not enabled' });
      return;
    }

    const { id } = req.params;
    const userId = (req as any).userId;

    const file = await File.findById(id);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    // Check if user has access (public or owner)
    if (!file.isPublic && file.userId !== userId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    if (file.storageType !== 's3' || !file.s3Key) {
      res.status(400).json({ message: 'File is not stored in S3' });
      return;
    }

    const presignedUrl = await s3Service.generatePresignedDownloadUrl(file.s3Key);

    res.status(200).json({
      presignedUrl,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    logger.error('Generate presigned download URL error:', error);
    res.status(500).json({ message: 'Error generating presigned download URL' });
  }
};

// Get S3 configuration info
export const getS3Config = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      useS3: config.USE_S3,
      bucketName: config.USE_S3 ? config.S3_BUCKET_NAME : null,
      region: config.USE_S3 ? config.S3_BUCKET_REGION : null,
    });
  } catch (error) {
    logger.error('Get S3 config error:', error);
    res.status(500).json({ message: 'Error getting S3 configuration' });
  }
};

