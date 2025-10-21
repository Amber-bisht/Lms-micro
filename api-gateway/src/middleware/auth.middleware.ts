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

