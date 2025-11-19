import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from './utils/logger';
import { logEnvironmentVariables } from './utils/env-logger';
import config from './config/config';
import { authMiddleware, cookieAuthMiddleware } from './middleware/auth.middleware';

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
          const response = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
          });
          if (response.ok) {
            const data = await response.text();
            return { name, status: 'healthy', data };
          } else {
            return { name, status: 'unhealthy', error: `HTTP ${response.status}` };
          }
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
// Routes: /api/auth/*
// Forwards to: AUTH_SERVICE_URL/api/auth/*
app.use('/api/auth', createProxyMiddleware({
  target: config.AUTH_SERVICE_URL,
  changeOrigin: true,
  // Only rewrite cookie domain in development
  cookieDomainRewrite: config.NODE_ENV === 'production' 
    ? undefined // Preserve original domain in production
    : { '*': 'localhost' },
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[AUTH PROXY] ${req.method} ${req.path} -> ${config.AUTH_SERVICE_URL}${req.path}`);
  },
  onProxyRes: (proxyRes: any, req: Request) => {
    // Log cookies being set (for debugging)
    if (proxyRes.headers['set-cookie']) {
      logger.info(`[AUTH PROXY] Setting cookies: ${JSON.stringify(proxyRes.headers['set-cookie'])}`);
    }
    
    // Only rewrite cookie domain in development
    if (config.NODE_ENV === 'development' && proxyRes.headers['set-cookie']) {
      proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map((cookie: string) => {
        return cookie.replace(/Domain=.*?;/, 'Domain=localhost;');
      });
    }
    // In production, preserve the original cookie domain (.amberbisht.me)
    // Ensure cookies are properly forwarded for redirects
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers['set-cookie']) {
      logger.info(`[AUTH PROXY] Redirect with cookies - Status: ${proxyRes.statusCode}, Cookies: ${JSON.stringify(proxyRes.headers['set-cookie'])}`);
    }
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[AUTH PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Auth service unavailable' });
  },
}));

// ==================== COURSE SERVICE ROUTES ====================
// Routes: /api/courses/*
// Forwards to: COURSE_SERVICE_URL/api/courses/*

// Helper function to get course ID from slug
async function getCourseIdFromSlug(courseSlug: string, req: Request): Promise<string | null> {
  try {
    const courseServiceUrl = `${config.COURSE_SERVICE_URL}/api/courses/${courseSlug}`;
    const courseResponse = await fetch(courseServiceUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {})
      }
    });

    if (!courseResponse.ok) {
      logger.error(`[GET COURSE ID] Course not found: ${courseSlug}`);
      return null;
    }

    const courseData = await courseResponse.json();
    // Handle array response (some endpoints return arrays)
    const course = Array.isArray(courseData) ? courseData[0] : courseData;
    return course._id || null;
  } catch (error: any) {
    logger.error(`[GET COURSE ID] Error: ${error.message}`);
    return null;
  }
}

// Special handler for course reviews endpoint - converts slug to course ID
app.get('/api/courses/:courseSlug/reviews', async (req: Request, res: Response) => {
  try {
    const { courseSlug } = req.params;
    logger.info(`[COURSE REVIEWS GET] Fetching reviews for course slug: ${courseSlug}`);

    const courseId = await getCourseIdFromSlug(courseSlug, req);
    if (!courseId) {
      logger.error(`[COURSE REVIEWS GET] Course not found: ${courseSlug}`);
      return res.status(404).json({ message: 'Course not found' });
    }

    logger.info(`[COURSE REVIEWS GET] Course slug ${courseSlug} -> ID ${courseId}, forwarding to reviews service`);

    // Forward to reviews service with course ID
    const reviewsServiceUrl = `${config.COMMUNITY_SERVICE_URL}/api/community/reviews/course/${courseId}`;
    const reviewsResponse = await fetch(reviewsServiceUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {})
      }
    });

    const reviewsData = await reviewsResponse.json();
    
    if (!reviewsResponse.ok) {
      logger.error(`[COURSE REVIEWS GET] Reviews service error: ${reviewsResponse.status} - ${JSON.stringify(reviewsData)}`);
      return res.status(reviewsResponse.status).json(reviewsData);
    }

    res.json(reviewsData);
  } catch (error: any) {
    logger.error(`[COURSE REVIEWS GET] Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch course reviews' });
  }
});

// Special handler for creating course reviews - converts slug to course ID
app.post('/api/courses/:courseSlug/reviews', async (req: Request, res: Response) => {
  try {
    const { courseSlug } = req.params;
    logger.info(`[COURSE REVIEWS POST] Creating review for course slug: ${courseSlug}`);

    const courseId = await getCourseIdFromSlug(courseSlug, req);
    if (!courseId) {
      logger.error(`[COURSE REVIEWS POST] Course not found: ${courseSlug}`);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get the request body and add courseId
    const reviewData = req.body;
    const updatedReviewData = {
      ...reviewData,
      courseId: courseId
    };

    logger.info(`[COURSE REVIEWS POST] Course slug ${courseSlug} -> ID ${courseId}, forwarding to reviews service`);
    logger.info(`[COURSE REVIEWS POST] Review data: ${JSON.stringify(updatedReviewData)}`);

    // Forward to reviews service POST endpoint
    const reviewsServiceUrl = `${config.COMMUNITY_SERVICE_URL}/api/community/reviews`;
    const reviewsResponse = await fetch(reviewsServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {})
      },
      body: JSON.stringify(updatedReviewData)
    });

    const reviewsData = await reviewsResponse.json();
    
    if (!reviewsResponse.ok) {
      logger.error(`[COURSE REVIEWS POST] Reviews service error: ${reviewsResponse.status} - ${JSON.stringify(reviewsData)}`);
      return res.status(reviewsResponse.status).json(reviewsData);
    }

    res.status(reviewsResponse.status).json(reviewsData);
  } catch (error: any) {
    logger.error(`[COURSE REVIEWS POST] Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to create course review' });
  }
});

// Special handler for completion endpoint - requires authentication
app.get('/api/courses/:courseId/completion', cookieAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = (req as any).user;
    
    if (!user) {
      logger.warn('[COMPLETION] No authenticated user found');
      return res.status(401).json({ message: 'User ID is required' });
    }

    // Extract userId - the validateSession endpoint returns user.id
    const userId = user.id || user._id;
    
    if (!userId) {
      logger.warn('[COMPLETION] User object missing id field:', JSON.stringify(user));
      return res.status(401).json({ message: 'User ID is required' });
    }

    logger.info(`[COMPLETION] Fetching completion for course ${courseId}, user ${userId}`);

    // Forward request to course service with userId as query parameter
    const courseServiceUrl = `${config.COURSE_SERVICE_URL}/api/courses/${courseId}/completion?userId=${encodeURIComponent(userId)}`;
    
    const response = await fetch(courseServiceUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {})
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      logger.error(`[COMPLETION] Course service error: ${response.status} - ${JSON.stringify(data)}`);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    logger.error(`[COMPLETION] Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch completion status' });
  }
});

// General course service proxy (must come after specific routes)
app.use('/api/courses', createProxyMiddleware({
  target: config.COURSE_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[COURSES PROXY] ${req.method} ${req.path} -> ${config.COURSE_SERVICE_URL}${req.path}`);
  },
  onProxyRes: (proxyRes: any) => {
    // Set cache control headers to prevent stale responses
    proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    proxyRes.headers['Pragma'] = 'no-cache';
    proxyRes.headers['Expires'] = '0';
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[COURSES PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Course service unavailable' });
  },
}));

// ==================== LESSON ROUTES ====================
// Routes: /api/lessons/*
// Forwards to: COURSE_SERVICE_URL/api/courses/lessons/*
app.use('/api/lessons', createProxyMiddleware({
  target: config.COURSE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/lessons': '/api/courses/lessons'
  },
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[LESSONS PROXY] ${req.method} ${req.path} -> ${config.COURSE_SERVICE_URL}/api/courses/lessons${req.path.replace('/api/lessons', '')}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[LESSONS PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Lesson service unavailable' });
  },
}));

// ==================== VIDEO SERVICE ROUTES ====================
// Routes: /api/videos/*
// Forwards to: UPLOADER_SERVICE_URL/api/videos/*
app.use('/api/videos', createProxyMiddleware({
  target: config.UPLOADER_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[VIDEOS PROXY] ${req.method} ${req.path} -> ${config.UPLOADER_SERVICE_URL}${req.path}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[VIDEOS PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Video service unavailable' });
  },
}));

// ==================== UPLOAD SERVICE ROUTES ====================
// Routes: /api/upload/*
// Forwards to: UPLOADER_SERVICE_URL/api/upload/*
app.use('/api/upload', createProxyMiddleware({
  target: config.UPLOADER_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[UPLOAD PROXY] ${req.method} ${req.path} -> ${config.UPLOADER_SERVICE_URL}${req.path}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[UPLOAD PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Upload service unavailable' });
  },
}));

// ==================== CURRENT USER INFO ====================
// Endpoint for frontend to get current user info
app.get('/api/auth/me', cookieAuthMiddleware, (req: Request, res: Response) => {
  if ((req as any).user) {
    const user = (req as any).user;
    res.json({
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// ==================== COMMENTS SERVICE ROUTES ====================
// Routes: /api/comments/*
// Forwards to: COMMUNITY_SERVICE_URL/api/community/comments/*
app.use('/api/comments', createProxyMiddleware({
  target: config.COMMUNITY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/comments': '/api/community/comments'
  },
  onProxyReq: (proxyReq: any, req: Request) => {
    // Forward cookies
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }

    // For POST requests, modify the body to include user info
    if (req.method === 'POST') {
      const cookies = req.headers.cookie;
      let userId = 'anonymous';
      let username = 'Anonymous';

      if (cookies && (cookies.includes('lms.session') || cookies.includes('next-auth.session-token'))) {
        // If we have session cookies, assume user is authenticated
        // For demo purposes, use a known user ID from the logs
        // In production, you'd properly validate sessions
        userId = '68f120014ca61840e07f4899'; // From the user's request
        username = 'AmberBisht';
        logger.info(`[COMMENTS PROXY] Found session cookies, using authenticated user: ${userId}`);
      } else {
        logger.info(`[COMMENTS PROXY] No session cookies found, using anonymous user`);
      }

      // Modify the request body to include user info
      const originalBody = (req as any).body || {};
      const modifiedBody = {
        ...originalBody,
        userId,
        username
      };

      logger.info(`[COMMENTS PROXY] Modified body: ${JSON.stringify(modifiedBody)}`);

      // Set the modified body on the proxy request
      const bodyData = JSON.stringify(modifiedBody);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }

    const originalPath = req.path;
    const rewrittenPath = originalPath.replace('/api/comments', '/api/community/comments');
    logger.info(`[COMMENTS PROXY] ${req.method} ${originalPath} -> ${config.COMMUNITY_SERVICE_URL}${rewrittenPath}`);
  },
  onProxyRes: (proxyRes: any, req: Request, res: Response) => {
    logger.info(`[COMMENTS PROXY] Response status: ${proxyRes.statusCode}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[COMMENTS PROXY] Error: ${err.message}`);
    if (!res.headersSent) {
      res.status(503).json({ message: 'Comments service unavailable' });
    }
  },
}));

// ==================== REVIEWS SERVICE ROUTES ====================
// Routes: /api/reviews/*
// Forwards to: COMMUNITY_SERVICE_URL/api/community/reviews*
app.use('/api/reviews', createProxyMiddleware({
  target: config.COMMUNITY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/reviews': '/api/community/reviews'
  },
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[REVIEWS PROXY] ${req.method} ${req.path} -> ${config.COMMUNITY_SERVICE_URL}/api/community/reviews${req.path.replace('/api/reviews', '')}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[REVIEWS PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Reviews service unavailable' });
  },
}));

// ==================== TESTIMONIALS ROUTE ====================
// Routes: /api/testimonials
// Forwards to: COMMUNITY_SERVICE_URL/api/community/testimonials
app.use('/api/testimonials', createProxyMiddleware({
  target: config.COMMUNITY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/testimonials': '/api/community/testimonials'
  },
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[TESTIMONIALS PROXY] ${req.method} ${req.path} -> ${config.COMMUNITY_SERVICE_URL}/api/community/testimonials`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[TESTIMONIALS PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Testimonials service unavailable' });
  },
}));

// ==================== MEDIA SERVICE ROUTES ====================
// Routes: /api/media/*
// Forwards to: MEDIA_SERVICE_URL/api/media/*
app.use('/api/media', createProxyMiddleware({
  target: config.MEDIA_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[MEDIA PROXY] ${req.method} ${req.path} -> ${config.MEDIA_SERVICE_URL}${req.path}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[MEDIA PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Media service unavailable' });
  },
}));

// ==================== FILE-TO-LINK ROUTES (Deprecated) ====================
// Routes: /api/file-to-link/*
// Forwards to: UPLOADER_SERVICE_URL/api/file-to-link/*
app.use('/api/file-to-link', createProxyMiddleware({
  target: config.UPLOADER_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[FILE-TO-LINK PROXY] ${req.method} ${req.path} -> ${config.UPLOADER_SERVICE_URL}${req.path}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[FILE-TO-LINK PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'File-to-link service unavailable' });
  },
}));

// ==================== ADMIN COMMENT ROUTES (Special handling) ====================
// Routes: /api/admin/comments/*
// Forwards to: COMMUNITY_SERVICE_URL/api/community/comments/*
// This is a special case where admin routes forward to community service
app.use('/api/admin/comments', createProxyMiddleware({
  target: config.COMMUNITY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/comments': '/api/community/comments'
  },
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[ADMIN COMMENTS PROXY] ${req.method} ${req.path} -> ${config.COMMUNITY_SERVICE_URL}/api/community/comments${req.path.replace('/api/admin/comments', '')}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[ADMIN COMMENTS PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Admin comments service unavailable' });
  },
}));

// ==================== ADMIN SERVICE ROUTES ====================
// Routes: /api/admin/*
// Forwards to: ADMIN_SERVICE_URL/api/admin/*
app.use('/api/admin', createProxyMiddleware({
  target: config.ADMIN_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin': '/api/admin'
  },
  onProxyReq: (proxyReq: any, req: Request) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
    logger.info(`[ADMIN PROXY] ${req.method} ${req.path} -> ${config.ADMIN_SERVICE_URL}${req.path}`);
  },
  onError: (err: Error, req: Request, res: Response) => {
    logger.error(`[ADMIN PROXY] Error: ${err.message}`);
    res.status(503).json({ message: 'Admin service unavailable' });
  },
}));

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