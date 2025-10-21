import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: parseInt(process.env.PORT || '3009', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/lms-community',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  COURSE_SERVICE_URL: process.env.COURSE_SERVICE_URL || 'http://localhost:3004',
};

