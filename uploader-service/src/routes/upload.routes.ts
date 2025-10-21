import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Upload single file
router.post('/single', upload.single('file'), uploadController.uploadFile);

// Upload multiple files (max 10)
router.post('/multiple', upload.array('files', 10), uploadController.uploadMultipleFiles);

// Get user files
router.get('/user/:userId', uploadController.getUserFiles);

// Get file by ID
router.get('/:id', uploadController.getFileById);

// Delete file
router.delete('/:id', uploadController.deleteFile);

// S3 specific routes
// Generate presigned URL for direct upload
router.post('/s3/presigned-upload', uploadController.generatePresignedUploadUrl);

// Generate presigned URL for download
router.get('/s3/presigned-download/:id', uploadController.generatePresignedDownloadUrl);

// Get S3 configuration
router.get('/s3/config', uploadController.getS3Config);

export default router;

