import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import config from './config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info(`💬 Community Service MongoDB connected: ${config.MONGODB_URI}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error instanceof Error ? error.message : 'Unknown'}`);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

