import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from './utils/logger';
import { logEnvironmentVariables } from './utils/env-logger';
import config from './config/config';
import { authMiddleware } from './middleware/auth.middleware';
import axios from 'axios';

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'https://lms.amberbisht.me', 
    'https://www.lms.amberbisht.me',
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5000',
    'http://lms.amberbisht.me'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'Accept'],
}));

// Logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const services = {
      auth: `${config.AUTH_SERVICE_URL}/health`,
      course: `${config.COURSE_SERVICE_URL}/health`,
      uploader: `${config.UPLOADER_SERVICE_URL}/health`,
      community: `${config.COMMUNITY_SERVICE_URL}/health`,
      admin: `${config.ADMIN_SERVICE_URL}/health`,
    };

    const healthChecks = await Promise.allSettled(
      Object.entries(services).map(async ([name, url]) => {
        try {
          const response = await axios.get(url, { timeout: 2000 });
          return { name, status: 'healthy', data: response.data };
        } catch (error) {
          return { name, status: 'unhealthy', error: (error as Error).message };
        }
      })
    );

    const results = healthChecks.map((result) => 
      result.status === 'fulfilled' ? result.value : { status: 'error' }
    );

    const allHealthy = results.every((r) => r.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'api-gateway',
      services: results,
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'api-gateway',
      error: (error as Error).message,
    });
  }
});

// Test direct reviews endpoint
app.post('/api/test-reviews', async (req: Request, res: Response) => {
  try {
    logger.info(`[TEST-REVIEWS] Direct call to community service`);
    const response = await axios.post(`${config.COMMUNITY_SERVICE_URL}/api/community/reviews`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error(`[TEST-REVIEWS] Error: ${error.message}`);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Reviews service unavailable' }
    );
  }
});

// ==================== AUTH SERVICE ROUTES ====================
app.use('/api/auth', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  // Only rewrite cookie domain in development
  cookieDomainRewrite: config.NODE_ENV === 'production' 
    ? undefined // Preserve original domain in production
    : { '*': 'localhost' },
  onProxyReq: (proxyReq: any, req: Request, res: Response) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
  },
  onProxyRes: (proxyRes: any, req: Request, res: Response) => {
    // Only rewrite cookie domain in development
    if (config.NODE_ENV === 'development' && proxyRes.headers['set-cookie']) {
      proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map((cookie: string) => {
        return cookie.replace(/Domain=.*?;/, 'Domain=localhost;');
      });
    }
    // In production, preserve the original cookie domain (.amberbisht.me)
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`Auth service error: ${err.message}`);
    res.status(503).json({ message: 'Auth service unavailable' });
  },
}));

// ==================== COURSE SERVICE ROUTES ====================
app.use('/api/courses', async (req: Request, res: Response) => {
  try {
    logger.info(`[COURSES] Direct call: ${req.method} ${req.path}`);
    logger.info(`[COURSES] Full URL: ${req.url}`);
    
    let targetUrl = `${config.COURSE_SERVICE_URL}/api/courses`;
    
    // Preserve query parameters
    if (req.url.includes('?')) {
      const queryString = req.url.split('?')[1];
      targetUrl += `?${queryString}`;
    }
    
    // Handle specific course routes with path parameters
    // Check for slug-based enrollment/lesson routes
    if (req.path.match(/^\/slug\/[^\/]+\/(enrollment|enroll)/)) {
      // Handle slug-based enrollment and lesson routes first
      // e.g., /slug/amber-lms-test/enrollment or /slug/amber-lms-test/lessons/123
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses${req.path}`;
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        targetUrl += `?${queryString}`;
      }
      logger.info(`[COURSES] Matched slug enrollment route, targeting: ${targetUrl}`);
    } else if (req.path.includes('/slug/')) {
      // Handle simple slug routes
      // e.g., /slug/amber-lms-test
      const slug = req.path.split('/slug/')[1];
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses/slug/${slug}`;
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        targetUrl += `?${queryString}`;
      }
    } else if (req.path.match(/\/[a-f0-9]{24}\/(comments|lessons|enrollment|enroll|complete|completion)/)) {
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses${req.path}`;
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        targetUrl += `?${queryString}`;
      }
    } else if (req.path.match(/\/[a-f0-9]{24}\/lessons\/[a-f0-9]{24}\/complete/)) {
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses${req.path}`;
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        targetUrl += `?${queryString}`;
      }
    } else if (req.method === 'POST' && req.path === '/create') {
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses/create`;
    } else if ((req.method === 'PUT' || req.method === 'DELETE') && req.path.match(/^\/[a-f0-9]{24}$/)) {
      // Handle PUT/DELETE requests with MongoDB ObjectId (24 hex characters)
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses${req.path}`;
    } else if (req.path && req.path !== '/') {
      // Catch-all: forward any other path-based requests
      // This handles routes like /:slug/:lessonId for video playback
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses${req.path}`;
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        targetUrl += `?${queryString}`;
      }
      logger.info(`[COURSES] Catch-all route, including path: ${req.path}`);
    }
    
    logger.info(`[COURSES] Final target URL: ${targetUrl}`);
    
    // Forward cookies explicitly for session-based auth if needed
    const headers: any = {
      'Content-Type': 'application/json',
      ...req.headers
    };
    
    // Ensure Cookie header is forwarded if present
    if (req.headers.cookie) {
      headers['Cookie'] = req.headers.cookie;
    }
    
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers,
      timeout: 10000
    });
    
    logger.info(`[COURSES] Response status: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error(`[COURSES] Direct call error: ${error.message}`);
    logger.error(`[COURSES] Error details: ${JSON.stringify(error.response?.data)}`);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Course service unavailable' }
    );
  }
});

// ==================== LESSON ROUTES ====================
app.use('/api/lessons', createProxyMiddleware({
  target: config.COURSE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/lessons': '/api/courses/lessons'
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`Lesson service error: ${err.message}`);
    res.status(503).json({ message: 'Lesson service unavailable' });
  },
}));

// ==================== VIDEO SERVICE ROUTES ====================
app.use('/api/videos', async (req: Request, res: Response) => {
  try {
    logger.info(`[VIDEOS] Direct call: ${req.method} ${req.path}`);
    
    const targetUrl = `${config.UPLOADER_SERVICE_URL}/api/videos${req.path}`;
    
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 10000
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error(`[VIDEOS] Direct call error: ${error.message}`);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Video service unavailable' }
    );
  }
});

// ==================== COMMENTS SERVICE ROUTES ====================
app.use('/api/comments', async (req: Request, res: Response) => {
  try {
    logger.info(`[COMMENTS] Direct call: ${req.method} ${req.path}`);
    
    const targetUrl = `${config.COMMUNITY_SERVICE_URL}/api/community/comments${req.path}`;
    
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 10000
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error(`[COMMENTS] Direct call error: ${error.message}`);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Comments service unavailable' }
    );
  }
});

// ==================== REVIEWS SERVICE ROUTES ====================
app.use('/api/reviews', async (req: Request, res: Response) => {
  try {
    logger.info(`[REVIEWS] Direct call: ${req.method} ${req.path}`);
    
    const targetUrl = `${config.COMMUNITY_SERVICE_URL}/api/community/reviews`;
    
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 10000
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error(`[REVIEWS] Direct call error: ${error.message}`);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Reviews service unavailable' }
    );
  }
});

// ==================== ADMIN SERVICE ROUTES ====================
app.use('/api/admin', createProxyMiddleware({
  target: config.ADMIN_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/users/([^/]+)/ban$': '/api/auth/admin/users/$1/ban',
    '^/api/admin/users': '/api/auth/admin/users',
    '^/api/admin/comments/([^/]+)$': '/api/community/admin/comments/$1',
    '^/api/admin/comments': '/api/community/admin/comments',
    '^/api/admin': '/api/admin'
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`Admin route error: ${err.message}`);
    res.status(503).json({ message: 'Admin service unavailable' });
  },
}));

// ==================== CUSTOM ENROLLMENT ROUTE ====================
app.post('/api/courses/:courseId/enroll', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = (req as any).user;
    
    const response = await axios.post(
      `${config.COURSE_SERVICE_URL}/api/courses/${courseId}/enroll`,
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      }
    );
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error('Enrollment error:', error);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Enrollment failed' }
    );
  }
});

// ==================== CUSTOM COURSE COMPLETION ROUTE ====================
app.post('/api/courses/:courseId/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = (req as any).user;
    
    const response = await axios.post(
      `${config.COURSE_SERVICE_URL}/api/courses/${courseId}/complete`,
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      }
    );
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error('Course completion error:', error);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Course completion failed' }
    );
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error' 
  });
});

// Start server
// Log environment variables
logEnvironmentVariables('api-gateway', config);

const PORT = config.PORT;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`Routing to services:`);
  logger.info(`  - Auth: ${config.AUTH_SERVICE_URL}`);
  logger.info(`  - Courses: ${config.COURSE_SERVICE_URL}`);
  logger.info(`  - Uploader: ${config.UPLOADER_SERVICE_URL}`);
  logger.info(`  - Community: ${config.COMMUNITY_SERVICE_URL}`);
  logger.info(`  - Admin: ${config.ADMIN_SERVICE_URL}`);
});