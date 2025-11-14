import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import config from './config';

export const connectDB = async (): Promise<void> => {
  try {
    // Ensure database name is included in connection string
    let mongoUri = config.MONGODB_URI;
    
    // Check if database name is already in the URI
    // Format: mongodb+srv://user:pass@host/dbname or mongodb://user:pass@host:port/dbname
    const uriParts = mongoUri.split('/');
    const hasDatabase = uriParts.length > 3 && uriParts[3] && uriParts[3].trim() !== '';
    
    if (!hasDatabase) {
      // Remove trailing slash if present and any query parameters
      mongoUri = mongoUri.split('?')[0].replace(/\/$/, '');
      // Append database name
      mongoUri = `${mongoUri}/lms-auth`;
      logger.info(`[DB] Appended database name to URI: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
    } else {
      logger.info(`[DB] Database name already in URI: ${uriParts[3].split('?')[0]}`);
    }
    
    await mongoose.connect(mongoUri);
    logger.info('✅ Auth Service - MongoDB connected successfully');
    logger.info(`[DB] Connected to database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
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

