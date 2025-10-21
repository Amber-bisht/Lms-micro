import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: parseInt(process.env.PORT || '3008', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  DAILYMOTION_API_KEY: process.env.DAILYMOTION_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

