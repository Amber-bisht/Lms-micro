import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from './utils/logger';
import config from './config/config';
import { authMiddleware } from './middleware/auth.middleware';
import axios from 'axios';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
app.use(cors({
  origin: config.NODE_ENV === 'production' 
    ? ['https://lms.amberbisht.me', 'https://www.lms.amberbisht.me']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'Accept'],
}));

// Logging middleware
app.use((req, _res, next) => {
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
      media: `${config.MEDIA_SERVICE_URL}/health`,
      community: `${config.COMMUNITY_SERVICE_URL}/health`,
      admin: `${config.ADMIN_SERVICE_URL}/health`,
      embedPlayer: `${config.EMBED_PLAYER_SERVICE_URL}/api/embed/health`,
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

// ==================== AUTH SERVICE ROUTES ====================
app.use('/api/auth', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth/blocked-ips/([^/]+)$': '/api/auth/blocked-ips/$1',
    '^/api/auth': '/api/auth'
  },
  cookieDomainRewrite: {
    '*': 'localhost'
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward cookies from the original request
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Forward cookies from the auth service response
    if (proxyRes.headers['set-cookie']) {
      proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
        return cookie.replace(/Domain=.*?;/, 'Domain=localhost;');
      });
    }
  },
  onError: (err, req, res) => {
    logger.error(`Auth service error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Auth service unavailable' });
  },
}));



// ==================== COURSE SERVICE ROUTES ====================
// Courses route (frontend calls /api/courses) - Direct axios call instead of proxy
app.use('/api/courses', async (req: Request, res: Response) => {
  try {
    logger.info(`[COURSES] Direct call: ${req.method} ${req.path}`);
    logger.info(`[COURSES] Request body: ${JSON.stringify(req.body)}`);
    
    // Handle different course routes
    let targetUrl = `${config.COURSE_SERVICE_URL}/api/courses`;
    
    // Handle specific course routes with path parameters
    if (req.path.includes('/slug/')) {
      const slug = req.path.split('/slug/')[1];
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses/slug/${slug}`;
    } else if (req.path.match(/\/[^\/]+\/(comments|lessons|reviews|enrollment|enroll|complete|completion)/)) {
      // Handle routes like /api/courses/{id}/comments, /api/courses/{id}/lessons, etc.
      targetUrl = `${config.COURSE_SERVICE_URL}${req.path}`;
    } else if (req.path.match(/\/[^\/]+\/lessons\/[^\/]+\/complete/)) {
      // Handle routes like /api/courses/{id}/lessons/{lessonId}/complete
      targetUrl = `${config.COURSE_SERVICE_URL}${req.path}`;
    } else if (req.method === 'POST' && req.path === '/') {
      // Handle course creation - the course service expects POST /create
      targetUrl = `${config.COURSE_SERVICE_URL}/api/courses/create`;
    }
    
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
    
    logger.info(`[COURSES] Response status: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error(`[COURSES] Direct call error: ${error.message}`);
    logger.error(`[COURSES] Error details: ${JSON.stringify(error.response?.data || error.message)}`);
    res.status(error.response?.status || 500).json(
      error.response?.data || { message: 'Course service unavailable' }
    );
  }
});

// ==================== UPLOADER SERVICE ROUTES ====================
app.use('/api/upload', createProxyMiddleware({
  target: config.UPLOADER_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    logger.error(`Uploader service error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Uploader service unavailable' });
  },
}));





// ==================== COMMUNITY SERVICE ROUTES ====================
app.use('/api/community', createProxyMiddleware({
  target: config.COMMUNITY_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    logger.error(`Community service error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Community service unavailable' });
  },
}));

// ==================== MEDIA SERVICE ROUTES ====================
app.use('/api/media', createProxyMiddleware({
  target: config.MEDIA_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    logger.error(`Media service error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Media service unavailable' });
  },
}));

// ==================== EMBED PLAYER SERVICE ROUTES ====================
app.use('/api/embed', createProxyMiddleware({
  target: config.EMBED_PLAYER_SERVICE_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    logger.error(`Embed player service error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Embed player service unavailable' });
  },
}));

// ==================== ADMIN SERVICE ROUTES ====================
// Admin routes are handled below with proper path rewriting


// ==================== ADDITIONAL ROUTES FOR FRONTEND COMPATIBILITY ====================

// Authentication routes (frontend calls /api/login, /api/logout, etc.)
app.use('/api/login', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/login': '/api/auth/login'
  },
  onError: (err, req, res) => {
    logger.error(`Login route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Auth service unavailable' });
  },
}));

app.use('/api/logout', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/logout': '/api/auth/logout'
  },
  onError: (err, req, res) => {
    logger.error(`Logout route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Auth service unavailable' });
  },
}));

app.use('/api/profile', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/profile': '/api/auth/profile'
  },
  onError: (err, req, res) => {
    logger.error(`Profile route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Profile service unavailable' });
  },
}));

app.use('/api/admin-login-google', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin-login-google': '/api/auth/admin-login-google'
  },
  onError: (err, req, res) => {
    logger.error(`Admin login route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Auth service unavailable' });
  },
}));



// User profile route (frontend calls /api/user)
app.use('/api/user', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/user': '/api/auth/profile'
  },
  onError: (err, req, res) => {
    logger.error(`User route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'User service unavailable' });
  },
}));

// Profile routes (frontend calls /api/profile/*)
app.use('/api/profile', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/profile/user/enrollments$': '/api/auth/profile/user/enrollments',
    '^/api/profile': '/api/auth/profile'
  },
  onError: (err, req, res) => {
    logger.error(`Profile route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Profile service unavailable' });
  },
}));



// Users route (frontend calls /api/users)
app.use('/api/users', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/auth/users'
  },
  onError: (err, req, res) => {
    logger.error(`Users route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Users service unavailable' });
  },
}));

// Comments route (frontend calls /api/comments)
app.use('/api/comments', createProxyMiddleware({
  target: config.COMMUNITY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/comments': '/api/community/comments'
  },
  onError: (err, req, res) => {
    logger.error(`Comments route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Comments service unavailable' });
  },
}));





// Users route (frontend calls /api/users)
app.use('/api/users', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/auth/users'
  },
  onError: (err, req, res) => {
    logger.error(`Users route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Users service unavailable' });
  },
}));

// Comments route (frontend calls /api/comments)
app.use('/api/comments', createProxyMiddleware({
  target: config.COMMUNITY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/comments': '/api/community/comments'
  },
  onError: (err, req, res) => {
    logger.error(`Comments route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Comments service unavailable' });
  },
}));

// Media routes (frontend calls /api/dailymotion, /api/youtube)
app.use('/api/dailymotion', createProxyMiddleware({
  target: config.MEDIA_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/dailymotion/test-playlist/([^/]+)$': '/api/media/dailymotion/test-playlist/$1',
    '^/api/dailymotion/playlist/([^/]+)$': '/api/media/dailymotion/playlist/$1',
    '^/api/dailymotion/parse$': '/api/media/dailymotion/parse',
    '^/api/dailymotion': '/api/media/dailymotion'
  },
  onError: (err, req, res) => {
    logger.error(`Dailymotion route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Dailymotion service unavailable' });
  },
}));

app.use('/api/youtube', createProxyMiddleware({
  target: config.MEDIA_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/youtube/playlist/([^/]+)$': '/api/media/youtube/playlist/$1',
    '^/api/youtube/parse$': '/api/media/youtube/parse',
    '^/api/youtube': '/api/media/youtube'
  },
  onError: (err, req, res) => {
    logger.error(`YouTube route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'YouTube service unavailable' });
  },
}));


// Admin routes (frontend calls /api/admin/*)
app.use('/api/admin', createProxyMiddleware({
  target: config.ADMIN_SERVICE_URL, // Admin routes go to admin service
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/users/([^/]+)/ban$': '/api/auth/admin/users/$1/ban',
    '^/api/admin/users': '/api/auth/admin/users',
    '^/api/admin/comments/([^/]+)$': '/api/community/admin/comments/$1',
    '^/api/admin/comments': '/api/community/admin/comments',
    '^/api/admin': '/api/admin'
  },
  onError: (err, req, res) => {
    logger.error(`Admin route error: ${err.message}`);
    (res as Response).status(503).json({ message: 'Admin service unavailable' });
  },
}));

// ==================== CUSTOM ENROLLMENT ROUTE (with user info injection) ====================
// This endpoint adds user info to the request body before proxying to course service
app.post('/api/courses/:courseId/enroll', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = (req as any).user;
    
    // Forward request to course service with user info
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
    
    // Forward request to course service with user info
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
const PORT = config.PORT;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`Routing to services:`);
  logger.info(`  - Auth: ${config.AUTH_SERVICE_URL}`);
  logger.info(`  - Courses: ${config.COURSE_SERVICE_URL}`);
  logger.info(`  - Uploader: ${config.UPLOADER_SERVICE_URL}`);
  logger.info(`  - Media: ${config.MEDIA_SERVICE_URL}`);
  logger.info(`  - Community: ${config.COMMUNITY_SERVICE_URL}`);
  logger.info(`  - Admin: ${config.ADMIN_SERVICE_URL}`);
  logger.info(`  - Embed Player: ${config.EMBED_PLAYER_SERVICE_URL}`);
});

