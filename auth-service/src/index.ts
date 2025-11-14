import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { connectDB, disconnectDB } from './config/database';
import { logger } from './utils/logger';
import { logEnvironmentVariables } from './utils/env-logger';
import config from './config/config';
import authRoutes from './routes/auth.routes';
import passport from './config/passport';

const app = express();

// Check if URL is for Upstash (contains 'upstash' or uses 'rediss://')
const isUpstash = 
  config.REDIS_URL.toLowerCase().includes('upstash') || 
  config.REDIS_URL.startsWith('rediss://');

// Normalize URL: if Upstash but using redis://, convert to rediss://
let redisUrl = config.REDIS_URL;
if (isUpstash && redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
  redisUrl = redisUrl.replace('redis://', 'rediss://');
  logger.info('🔒 Converted Redis URL to use TLS (rediss://) for Upstash');
}

if (isUpstash) {
  logger.info('🔐 Upstash Redis detected - TLS will be enabled');
}

// Initialize Redis client for sessions
const redisClient = createClient({
  url: redisUrl,
  socket: {
    keepAlive: 30000, // Keep connection alive with 30s pings
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        logger.error('Redis reconnection failed after 20 attempts');
        return new Error('Redis reconnection failed');
      }
      // Exponential backoff: 100ms, 200ms, 400ms, ... max 3s
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000, // 10s connection timeout
    // Enable TLS for Upstash Redis (even if URL doesn't have rediss://)
    ...(isUpstash && {
      tls: true,
      rejectUnauthorized: true,
    }),
  },
});

redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
redisClient.on('connect', () => logger.info('✅ Redis Client Connected'));
redisClient.on('ready', () => logger.info('✅ Redis Client Ready'));
redisClient.on('reconnecting', () => logger.info('🔄 Redis reconnecting...'));
redisClient.on('end', () => logger.warn('⚠️ Redis connection ended'));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    name: 'lms.session',
    store: new RedisStore({ client: redisClient }),
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: config.SESSION_EXPIRY * 1000,
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: config.NODE_ENV === 'production' ? '.lms.amberbisht.me' : undefined,
      path: '/',
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
app.use(cors({
  origin: config.NODE_ENV === 'production' 
    ? ['https://lms.amberbisht.me', 'https://www.lms.amberbisht.me']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'Accept'],
}));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

// Routes
app.use('/api/auth', authRoutes);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(`Error: ${message}`);
  res.status(status).json({ message });
});

// Initialize app
(async () => {
  try {
    // Log environment variables
    logEnvironmentVariables('auth-service', config);
    
    await connectDB();
    
    const port = config.PORT;
    app.listen(port, '0.0.0.0', () => {
      logger.info(`🚀 Auth Service running on port ${port}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error(`Server initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await redisClient.quit();
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await redisClient.quit();
  await disconnectDB();
  process.exit(0);
});

