import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { logEnvironmentVariables } from './utils/env-logger';
import config from './config/config';
import adminRoutes from './routes/admin.routes';
import { connectRedis, disconnectRedis } from './utils/redis';

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
  res.json({ status: 'healthy', service: 'admin-service' });
});

app.use('/api/admin', adminRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

(async () => {
  try {
    // Log environment variables
    logEnvironmentVariables('admin-service', config);
    
    await connectRedis();
    
    const port = config.PORT;
    app.listen(port, '0.0.0.0', () => {
      logger.info(`⚙️  Admin Service running on port ${port}`);
    });
  } catch (error) {
    logger.error(`Server error: ${error instanceof Error ? error.message : 'Unknown'}`);
    process.exit(1);
  }
})();

process.on('SIGTERM', async () => {
  await disconnectRedis();
  process.exit(0);
});

