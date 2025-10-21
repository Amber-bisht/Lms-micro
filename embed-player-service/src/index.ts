import express from 'express';
import cors from 'cors';
import config from './config/config';
import { logger } from './utils/logger';
import embedRoutes from './routes/embed.routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes
app.use('/api/embed', embedRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Embed Player Service',
    version: '1.0.0',
    endpoints: {
      health: '/api/embed/health',
      player: '/api/embed/player?videoUrl=YOUTUBE_URL',
      info: '/api/embed/info?videoUrl=YOUTUBE_URL',
      url: '/api/embed/url?videoUrl=YOUTUBE_URL'
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Embed Player Service running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
