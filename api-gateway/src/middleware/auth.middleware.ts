import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import config from '../config/config';
import { logger } from '../utils/logger';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    // Validate token with auth service
    const response = await axios.post(`${config.AUTH_SERVICE_URL}/api/auth/validate-token`, {
      token
    });

    if (response.data.valid) {
      // Attach user info to request
      (req as any).user = response.data.user;
      next();
    } else {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Middleware to authenticate via cookies (for frontend requests)
export const cookieAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract session cookie
    const cookies = req.headers.cookie;
    if (!cookies) {
      logger.warn('No cookies provided for authentication');
      res.status(401).json({ message: 'No session found' });
      return;
    }

    // Parse cookies to find the session token
    const cookieMap: { [key: string]: string } = {};
    cookies.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookieMap[key] = decodeURIComponent(value);
      }
    });

    // Try different possible cookie names for the session
    const sessionToken = cookieMap['lms.session'] || cookieMap['next-auth.session-token'];

    if (!sessionToken) {
      logger.warn('No session token found in cookies');
      res.status(401).json({ message: 'No session found' });
      return;
    }

    logger.info(`[COOKIE AUTH] Found session token, validating with auth service`);

    // Validate session with auth service
    const response = await axios.get(`${config.AUTH_SERVICE_URL}/api/auth/validate-session`, {
      headers: {
        'Cookie': `lms.session=${sessionToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    if (response.data && response.data.valid && response.data.user) {
      // Attach user info to request
      (req as any).user = response.data.user;
      logger.info(`[COOKIE AUTH] Authenticated user: ${response.data.user.username} (${response.data.user.id})`);
      next();
    } else {
      logger.warn('[COOKIE AUTH] Invalid session response:', response.data);
      res.status(401).json({ message: 'Invalid session' });
    }
  } catch (error: any) {
    logger.error('[COOKIE AUTH] Authentication error:', error.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

