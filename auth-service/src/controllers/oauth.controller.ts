import { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User';
import { logger } from '../utils/logger';
import config from '../config/config';

// Google OAuth callback
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info(`Google callback - User: ${req.user ? 'present' : 'not present'}`);
    logger.info(`Google callback - Session ID: ${req.sessionID}`);
    logger.info(`Google callback - Is authenticated: ${req.isAuthenticated ? req.isAuthenticated() : 'function not available'}`);
    logger.info(`Google callback - Passport in session: ${JSON.stringify((req.session as any)?.passport)}`);

    if (!req.user) {
      logger.error('Google callback - No user found');
      res.status(401).json({ message: 'Authentication failed' });
      return;
    }

    // Explicitly log in the user to ensure session is established
    req.login(req.user, (loginErr) => {
      if (loginErr) {
        logger.error(`Google callback - Login error: ${loginErr.message}`);
        res.redirect(`${config.FRONTEND_URL}/auth/error?message=Login error`);
        return;
      }

      logger.info(`Google callback - User logged in successfully`);
      
      // Ensure session is saved before redirecting
      req.session.save(async (err) => {
        if (err) {
          logger.error(`Session save error in Google callback: ${err.message}`);
          res.redirect(`${config.FRONTEND_URL}/auth/error?message=Session error`);
          return;
        }
        
        logger.info(`Google callback - Session saved successfully`);
        logger.info(`Google callback - Final session data: ${JSON.stringify(req.session)}`);
        logger.info(`Google callback - Session ID: ${req.sessionID}`);
        logger.info(`Google callback - User in session: ${JSON.stringify((req.session as any)?.passport)}`);
        
        
        // Set a test cookie to verify session is working
        res.cookie('oauth_test', 'success', {
          httpOnly: false,
          secure: config.NODE_ENV === 'production',
          sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
          domain: config.NODE_ENV === 'production' ? '.lms.amberbisht.me' : undefined,
          maxAge: 60000 // 1 minute
        });
        
        res.redirect(`${config.FRONTEND_URL}/auth/success`);
      });
    });
  } catch (error) {
    logger.error(`Google callback error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.redirect(`${config.FRONTEND_URL}/auth/error?message=Authentication failed`);
  }
};

// GitHub OAuth callback - DISABLED
export const githubCallback = async (req: Request, res: Response): Promise<void> => {
  res.status(404).json({ message: 'GitHub login disabled' });
  return;
};

// OAuth success handler
export const oauthSuccess = (req: Request, res: Response): void => {
  logger.info(`OAuth success - User: ${req.user ? 'present' : 'not present'}`);
  logger.info(`OAuth success - Session ID: ${req.sessionID}`);
  logger.info(`OAuth success - Is authenticated: ${req.isAuthenticated ? req.isAuthenticated() : 'function not available'}`);
  logger.info(`OAuth success - Passport in session: ${JSON.stringify((req.session as any)?.passport)}`);
  
  if (req.user) {
    const user = req.user as any;
    logger.info(`OAuth success - User authenticated: ${user.username} (${user._id})`);
    res.json({ 
      message: 'Authentication successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        hasCompletedProfile: user.hasCompletedProfile,
        avatar: user.avatar,
        fullName: user.fullName
      }
    });
  } else {
    logger.error('OAuth success - No user found');
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// OAuth error handler
export const oauthError = (req: Request, res: Response): void => {
  const errorMessage = req.query.message || 'Authentication failed';
  logger.error(`OAuth error: ${errorMessage}`);
  res.status(401).json({ message: errorMessage });
};

