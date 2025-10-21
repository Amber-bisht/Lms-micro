import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware to protect against common web vulnerabilities
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Content Security Policy - Restrict resource loading
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https: blob:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://www.youtube.com https://www.dailymotion.com https://archive.org",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '));

    // X-Frame-Options - Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options - Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection - Enable XSS filtering
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy - Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy - Control browser features
    res.setHeader('Permissions-Policy', [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', '));

    // Strict-Transport-Security - Force HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Cache-Control for sensitive routes
    if (req.path.startsWith('/api/') || req.path.includes('admin')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // Remove server information
    res.removeHeader('X-Powered-By');

    next();
  } catch (error) {
    console.error('Security headers middleware error:', error);
    next();
  }
};

/**
 * Additional security middleware for file uploads
 */
export const fileUploadSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Additional headers for file upload routes
    if (req.path.includes('upload')) {
      // Prevent file execution
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Limit file size (this should also be set in your upload middleware)
      res.setHeader('X-File-Size-Limit', '50MB');
      
      // Prevent file caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    
    next();
  } catch (error) {
    console.error('File upload security headers error:', error);
    next();
  }
};

/**
 * Rate limiting headers
 */
export const rateLimitHeaders = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add rate limit information to headers
    if ((req as any).rateLimit) {
      const rateLimit = (req as any).rateLimit;
      res.setHeader('X-RateLimit-Limit', rateLimit.limit);
      res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimit.resetTime);
    }
    
    next();
  } catch (error) {
    console.error('Rate limit headers error:', error);
    next();
  }
};

