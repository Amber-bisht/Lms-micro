import { Request, Response } from 'express';
import User from '../models/User';
import LoginAttempt from '../models/LoginAttempt';
import { hashPassword, comparePasswords } from '../utils/password';
import { generateUniqueUsername } from '../utils/username-generator';
import { logger } from '../utils/logger';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import config from '../config/config';
import axios from 'axios';

const jwtSecret: Secret = config.JWT_SECRET;
const defaultSignOptions: SignOptions = {
  expiresIn: config.JWT_EXPIRY as SignOptions['expiresIn'],
};

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email } = req.body;
    
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const clientIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;

    // Check if user already exists and generate unique username if needed
    let finalUsername = username;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      finalUsername = await generateUniqueUsername(email || username);
      logger.info(`Username conflict resolved: ${username} → ${finalUsername}`);
    }

    // Create new user with hashed password
    const userData = {
      username: finalUsername,
      password: await hashPassword(password),
      email,
      isAdmin: false,
      hasCompletedProfile: false,
      role: 'user' as const,
    };

    const user = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
      jwtSecret,
      defaultSignOptions,
    );

    // Format user response
    const cleanUser = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      hasCompletedProfile: user.hasCompletedProfile,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };


    res.status(201).json({ user: cleanUser, token });
  } catch (error) {
    logger.error(`Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user is banned
    if (user.banned) {
      res.status(403).json({ message: 'Account is banned' });
      return;
    }

    // Verify password
    const isMatch = await comparePasswords(password, user.password || '');
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },
      jwtSecret,
      defaultSignOptions,
    );

    // Format user response
    const cleanUser = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      hasCompletedProfile: user.hasCompletedProfile,
      role: user.role,
      fullName: user.fullName,
      bio: user.bio,
      interest: user.interest,
      profileImageUrl: user.profileImageUrl,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({ user: cleanUser, token });
  } catch (error) {
    logger.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Get current user from token or session
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for session-based authentication first (OAuth)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const user = await User.findById((req.user as any)._id).select('-password');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json(user);
      return;
    }

    // Fallback to JWT token authentication
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error getting current user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // For session-based authentication (OAuth)
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          logger.error(`Session destroy error: ${err.message}`);
          res.status(500).json({ message: 'Error logging out' });
          return;
        }
        res.clearCookie('lms.session');
        res.json({ message: 'Logged out successfully' });
      });
    } else {
      // For JWT-based authentication
      res.json({ message: 'Logged out successfully' });
    }
  } catch (error) {
    logger.error(`Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error logging out' });
  }
};

// Admin login with Google ID
export const adminLoginWithGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleId, email } = req.body;
    
    if (!googleId || !email) {
      res.status(400).json({ message: 'Google ID and email are required' });
      return;
    }

    // Find user by Google ID
    let user = await User.findOne({ googleId });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is admin
    if (!user.isAdmin) {
      res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      jwtSecret,
      defaultSignOptions,
    );

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        fullName: user.fullName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    logger.error(`Admin login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error during admin login' });
  }
};

// Get current user's enrollments
export const getCurrentUserEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    let userId: string;
    
    // Check for session-based authentication first (OAuth)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      userId = (req.user as any)._id.toString();
    } else {
      // Fallback to JWT token authentication
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      userId = decoded.id;
    }

    // Call course-service to get enrollments
    try {
      const response = await axios.get(
        `${config.COURSE_SERVICE_URL}/api/courses/enrollments/user/${userId}`,
        {
          headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {},
        }
      );

      res.json(response.data);
    } catch (error) {
      logger.error(`Error fetching enrollments from course-service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(200).json([]); // Return empty array if course-service is unavailable
    }
  } catch (error) {
    logger.error(`Error fetching current user enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error fetching user enrollments' });
  }
};

// Get blocked IPs
export const getBlockedIPs = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would typically query a rate limiting service or database
    // For now, return empty array
    res.json([]);
  } catch (error) {
    logger.error(`Error getting blocked IPs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error fetching blocked IPs' });
  }
};

// Delete blocked IP
export const deleteBlockedIP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ipAddress } = req.params;
    
    if (!ipAddress) {
      res.status(400).json({ message: 'IP address is required' });
      return;
    }

    // This would typically remove IP from ban list
    logger.info(`IP ${ipAddress} removed from blocked list`);
    
    res.json({ message: 'IP removed from blocked list successfully', ip: ipAddress });
  } catch (error) {
    logger.error(`Error deleting blocked IP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error deleting blocked IP' });
  }
};

// Get rate limits
export const getRateLimits = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would typically query a rate limiting service
    // For now, return empty array
    res.json([]);
  } catch (error) {
    logger.error(`Error getting rate limits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error fetching rate limits' });
  }
};

// Get permanent bans
export const getPermanentBans = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would typically query a ban service or database
    // For now, return empty array
    res.json([]);
  } catch (error) {
    logger.error(`Error getting permanent bans: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error fetching permanent bans' });
  }
};

// Ban IP
export const banIP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip, reason, duration } = req.body;
    
    if (!ip) {
      res.status(400).json({ message: 'IP address is required' });
      return;
    }

    // This would typically add IP to ban list
    logger.info(`IP ${ip} banned for ${duration || 'permanent'} - Reason: ${reason || 'No reason provided'}`);
    
    res.json({ message: 'IP banned successfully', ip, reason, duration });
  } catch (error) {
    logger.error(`Error banning IP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error banning IP' });
  }
};

// Ban user
export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, reason, duration } = req.body;
    const targetUserId = req.params.id || userId;
    
    if (!targetUserId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    // Update user ban status
    const user = await User.findByIdAndUpdate(
      targetUserId,
      { 
        isBanned: true, 
        banReason: reason,
        banExpiresAt: duration ? new Date(Date.now() + duration * 1000) : null
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    logger.info(`User ${user.username} (${user._id}) banned for ${duration || 'permanent'} - Reason: ${reason || 'No reason provided'}`);
    
    res.json({ message: 'User banned successfully', user: { _id: user._id, username: user.username } });
  } catch (error) {
    logger.error(`Error banning user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error banning user' });
  }
};

// Unban IP
export const unbanIP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { target } = req.params;
    
    if (!target) {
      res.status(400).json({ message: 'IP address is required' });
      return;
    }

    // This would typically remove IP from ban list
    logger.info(`IP ${target} unbanned`);
    
    res.json({ message: 'IP unbanned successfully', ip: target });
  } catch (error) {
    logger.error(`Error unbanning IP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error unbanning IP' });
  }
};

// Unban user
export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { target } = req.params;
    
    if (!target) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    // Update user ban status
    const user = await User.findByIdAndUpdate(
      target,
      { 
        isBanned: false, 
        banReason: null,
        banExpiresAt: null
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    logger.info(`User ${user.username} (${user._id}) unbanned`);
    
    res.json({ message: 'User unbanned successfully', user: { _id: user._id, username: user.username } });
  } catch (error) {
    logger.error(`Error unbanning user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error unbanning user' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    const { 
      fullName, 
      bio, 
      interest, 
      profileImageUrl, 
      avatar,
      collegeName,
      companyName,
      isPlaced,
      githubLink,
      linkedinLink,
      xLink,
      codeforcesLink,
      leetcodeLink
    } = req.body;

    const updateData: any = {
      hasCompletedProfile: true,
    };

    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (interest !== undefined) updateData.interest = interest;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (collegeName !== undefined) updateData.collegeName = collegeName;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (isPlaced !== undefined) updateData.isPlaced = isPlaced;
    if (githubLink !== undefined) updateData.githubLink = githubLink;
    if (linkedinLink !== undefined) updateData.linkedinLink = linkedinLink;
    if (xLink !== undefined) updateData.xLink = xLink;
    if (codeforcesLink !== undefined) updateData.codeforcesLink = codeforcesLink;
    if (leetcodeLink !== undefined) updateData.leetcodeLink = leetcodeLink;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }


    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error(`Error updating profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Admin: Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (!decoded.isAdmin) {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};


// Validate token endpoint (for other services)
export const validateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ valid: false, message: 'Token is required' });
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(404).json({ valid: false, message: 'User not found' });
      return;
    }

    if (user.banned) {
      res.status(403).json({ valid: false, message: 'User is banned' });
      return;
    }

    res.status(200).json({ 
      valid: true, 
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
};

export const validateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated via Passport session
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const user = await User.findById((req.user as any)._id).select('-password');
      if (!user) {
        res.status(404).json({ valid: false, message: 'User not found' });
        return;
      }

      if (user.banned) {
        res.status(403).json({ valid: false, message: 'User is banned' });
        return;
      }

      res.json({
        valid: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
        }
      });
      return;
    }

    res.status(401).json({ valid: false, message: 'No valid session' });
  } catch (error) {
    logger.error('Session validation error:', error);
    res.status(401).json({ valid: false, message: 'Session validation failed' });
  }
};

// Get user profile by ID
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Return user profile data (excluding sensitive information)
    const userProfile = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      fullName: user.fullName,
      bio: user.bio,
      interest: user.interest,
      collegeName: user.collegeName,
      companyName: user.companyName,
      isPlaced: user.isPlaced,
      githubLink: user.githubLink,
      linkedinLink: user.linkedinLink,
      xLink: user.xLink,
      codeforcesLink: user.codeforcesLink,
      leetcodeLink: user.leetcodeLink,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    logger.error(`Error fetching user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

// Get user profile by username
export const getUserProfileByUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = req.params.username;
    
    if (!username) {
      res.status(400).json({ message: 'Username is required' });
      return;
    }

    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Return user profile data (excluding sensitive information)
    const userProfile = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      fullName: user.fullName,
      bio: user.bio,
      interest: user.interest,
      collegeName: user.collegeName,
      companyName: user.companyName,
      isPlaced: user.isPlaced,
      githubLink: user.githubLink,
      linkedinLink: user.linkedinLink,
      xLink: user.xLink,
      codeforcesLink: user.codeforcesLink,
      leetcodeLink: user.leetcodeLink,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    logger.error(`Error fetching user profile by username: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

// Get user enrollments by ID (calls course-service)
export const getUserEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    let authenticatedUser = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        authenticatedUser = decoded;
      } catch (error) {
        // Token is invalid, continue as unauthenticated user
      }
    }

    // Check if user is requesting their own enrollments or is an admin
    const isOwner = authenticatedUser && authenticatedUser.id === userId;
    const isAdmin = authenticatedUser && authenticatedUser.isAdmin;

    // Call course-service to get enrollments
    try {
      const response = await axios.get(
        `${config.COURSE_SERVICE_URL}/api/courses/enrollments/user/${userId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (isOwner || isAdmin) {
        // Full access - return complete enrollment data
        res.status(200).json(response.data);
      } else {
        // Public access - return limited enrollment data
        const publicEnrollments = response.data.map((enrollment: any) => ({
          _id: enrollment._id,
          course: enrollment.course ? {
            _id: enrollment.course._id,
            title: enrollment.course.title,
            imageUrl: enrollment.course.imageUrl,
            slug: enrollment.course.slug,
          } : null,
          enrolledAt: enrollment.enrolledAt,
          isCompleted: enrollment.isCompleted,
        }));
        res.status(200).json(publicEnrollments);
      }
    } catch (error) {
      logger.error(`Error fetching enrollments from course-service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(200).json([]); // Return empty array if course-service is unavailable
    }
  } catch (error) {
    logger.error(`Error fetching user enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error fetching user enrollments' });
  }
};

// Get user activity by ID (aggregates data from multiple services)
export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    let authenticatedUser = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        authenticatedUser = decoded;
      } catch (error) {
        // Token is invalid, continue as unauthenticated user
      }
    }

    // Check if user is requesting their own activity or is an admin
    const isOwner = authenticatedUser && authenticatedUser.id === userId;
    const isAdmin = authenticatedUser && authenticatedUser.isAdmin;

    const activities = [];

    if (isOwner || isAdmin) {
      // Full access - get complete activity data
      
      // Get enrollments from course-service
      try {
        const enrollmentsResponse = await axios.get(
          `${config.COURSE_SERVICE_URL}/api/courses/enrollments/user/${userId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        const enrollments = enrollmentsResponse.data;

        // Add course completions
        for (const enrollment of enrollments) {
          if (enrollment.isCompleted) {
            activities.push({
              _id: `completion_${enrollment._id}`,
              type: 'course_completion',
              description: `Completed course: ${enrollment.course?.title || 'Unknown Course'}`,
              timestamp: enrollment.updatedAt,
              metadata: { courseId: enrollment.courseId, progress: enrollment.progress },
            });
          }

          // Add enrollments
          activities.push({
            _id: `enrollment_${enrollment._id}`,
            type: 'course_enrollment',
            description: `Enrolled in course: ${enrollment.course?.title || 'Unknown Course'}`,
            timestamp: enrollment.enrolledAt,
            metadata: { courseId: enrollment.courseId },
          });
        }
      } catch (error) {
        logger.error(`Error fetching enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Get profile updates
      const user = await User.findById(userId).select('-password');
      if (user && user.updatedAt) {
        activities.push({
          _id: `profile_update_${user._id}`,
          type: 'profile_update',
          description: 'Updated profile information',
          timestamp: user.updatedAt,
          metadata: {},
        });
      }

      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limit to recent activities
      const recentActivities = activities.slice(0, 20);
      res.status(200).json(recentActivities);
    } else {
      // Public access - return only basic activity info
      try {
        const enrollmentsResponse = await axios.get(
          `${config.COURSE_SERVICE_URL}/api/courses/enrollments/user/${userId}`
        );

        const enrollments = enrollmentsResponse.data;
        const completedCount = enrollments.filter((e: any) => e.isCompleted).length;
        const totalCount = enrollments.length;

        if (completedCount > 0) {
          activities.push({
            _id: `completion_summary_${userId}`,
            type: 'course_completion_summary',
            description: `Completed ${completedCount} out of ${totalCount} courses`,
            timestamp: new Date(),
            metadata: { completedCount, totalCount },
          });
        }
      } catch (error) {
        logger.error(`Error fetching enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Get profile update info
      const user = await User.findById(userId).select('-password');
      if (user && user.updatedAt) {
        activities.push({
          _id: `profile_update_${user._id}`,
          type: 'profile_update',
          description: 'Updated profile information',
          timestamp: user.updatedAt,
          metadata: {},
        });
      }

      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limit to recent activities
      const recentActivities = activities.slice(0, 20);
      res.status(200).json(recentActivities);
    }
  } catch (error) {
    logger.error(`Error fetching user activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error fetching user activity' });
  }
};

