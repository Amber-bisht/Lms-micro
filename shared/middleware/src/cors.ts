import { Request, Response, NextFunction } from 'express';

export interface CorsOptions {
  allowedOrigins?: string[];
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
}

/**
 * CORS middleware for microservices
 */
export const corsMiddleware = (options: CorsOptions = {}) => {
  const {
    allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'],
    credentials = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge = 86400, // 24 hours
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Allow requests from allowed origins
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Allow credentials
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Allow methods
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));

    // Allow headers
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));

    // Expose headers
    if (exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    // Max age
    res.setHeader('Access-Control-Max-Age', maxAge.toString());

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
};

