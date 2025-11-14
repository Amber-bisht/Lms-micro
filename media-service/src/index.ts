import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { logEnvironmentVariables } from './utils/env-logger';
import config from './config/config';
import mediaRoutes from './routes/media.routes';

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
  res.json({ status: 'healthy', service: 'media-service' });
});

app.use('/api/media', mediaRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Log environment variables
logEnvironmentVariables('media-service', config);

const port = config.PORT;
app.listen(port, '0.0.0.0', () => {
  logger.info(`📺 Media Service running on port ${port}`);
});

