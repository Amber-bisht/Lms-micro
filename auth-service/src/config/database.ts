import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import config from './config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('✅ Auth Service - MongoDB connected successfully');
  } catch (error) {
    logger.error(`❌ Auth Service - MongoDB connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(`MongoDB disconnect error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

