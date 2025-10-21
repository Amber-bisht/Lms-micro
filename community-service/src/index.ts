import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB, disconnectDB } from './config/database';
import { logger } from './utils/logger';
import config from './config/config';
import communityRoutes from './routes/community.routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: config.NODE_ENV === 'production' 
    ? ['https://lms.amberbisht.me']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'community-service' });
});

app.use('/api/community', communityRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

(async () => {
  try {
    await connectDB();
    
    const port = config.PORT;
    app.listen(port, '0.0.0.0', () => {
      logger.info(`💬 Community Service running on port ${port}`);
    });
  } catch (error) {
    logger.error(`Server error: ${error instanceof Error ? error.message : 'Unknown'}`);
    process.exit(1);
  }
})();

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

