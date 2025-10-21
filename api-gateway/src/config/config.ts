import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  COURSE_SERVICE_URL: process.env.COURSE_SERVICE_URL || 'http://localhost:3004',
  UPLOADER_SERVICE_URL: process.env.UPLOADER_SERVICE_URL || 'http://localhost:3005',
  MEDIA_SERVICE_URL: process.env.MEDIA_SERVICE_URL || 'http://localhost:3008',
  COMMUNITY_SERVICE_URL: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3009',
  ADMIN_SERVICE_URL: process.env.ADMIN_SERVICE_URL || 'http://localhost:3010',
  EMBED_PLAYER_SERVICE_URL: process.env.EMBED_PLAYER_SERVICE_URL || 'http://localhost:3006',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

