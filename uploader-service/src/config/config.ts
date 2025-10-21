import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: parseInt(process.env.PORT || '3005', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/lms-uploader',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf,video/mp4').split(','),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  CDN_URL: process.env.CDN_URL || '',
  
  // AWS S3 Configuration
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
  S3_BUCKET_REGION: process.env.S3_BUCKET_REGION || process.env.AWS_REGION || 'us-east-1',
  S3_ENDPOINT: process.env.S3_ENDPOINT || '', // For custom S3-compatible services
  USE_S3: process.env.USE_S3 === 'true' || false,
};

