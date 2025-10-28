import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3006,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lms-embed-player',
};
