import { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User';
import Profile from '../models/Profile';
import AccountDeletion from '../models/AccountDeletion';
import { logger } from '../utils/logger';
import config from '../config/config';

// Create or update user profile
export const createOrUpdateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId; // userId set by auth middleware
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { 
      fullName, 
      bio, 
      interest, 
      email,
      githubLink,
      linkedinLink,
      xLink,
      codeforcesLink,
      leetcodeLink,
      collegeName,
      companyName,
      isPlaced,
      profileImageUrl
    } = req.body;

    // Prevent email and fullName updates
    if (email !== undefined) {
      res.status(400).json({ message: 'Email cannot be modified after account creation' });
      return;
    }

    if (fullName !== undefined) {
      res.status(400).json({ message: 'Full name cannot be modified after account creation' });
      return;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update or create profile
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
    }

    // Update profile fields
    if (bio !== undefined) profile.bio = bio;
    if (interest !== undefined) profile.interest = interest;
    if (githubLink !== undefined) profile.githubLink = githubLink;
    if (linkedinLink !== undefined) profile.linkedinLink = linkedinLink;
    if (xLink !== undefined) profile.xLink = xLink;
    if (codeforcesLink !== undefined) profile.codeforcesLink = codeforcesLink;
    if (leetcodeLink !== undefined) profile.leetcodeLink = leetcodeLink;
    if (collegeName !== undefined) profile.collegeName = collegeName;
    if (companyName !== undefined) profile.companyName = companyName;
    if (isPlaced !== undefined) profile.isPlaced = isPlaced;
    if (profileImageUrl !== undefined) profile.profileImageUrl = profileImageUrl;

    await profile.save();

    // Update user's hasCompletedProfile flag
    const hasCompletedProfile = !!(
      user.fullName && 
      profile.bio && 
      profile.interest &&
      user.email
    );

    if (hasCompletedProfile && !user.hasCompletedProfile) {
      user.hasCompletedProfile = true;
      await user.save();

      // Award profile completion achievement
      try {
        await axios.post(`${config.ACHIEVEMENT_SERVICE_URL}/api/achievements/award-profile-completion`, {
          userId: user._id.toString(),
          email: user.email,
          username: user.username,
        });
      } catch (error) {
        logger.error('Error awarding profile completion achievement:', error);
      }
    }

    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    logger.error(`Profile creation/update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error creating/updating profile' });
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId; // userId set by auth middleware
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Get user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get profile
    const profile = await Profile.findOne({ userId });

    // Return combined profile data
    const profileData = {
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: profile?.bio,
      interest: profile?.interest,
      githubLink: profile?.githubLink,
      linkedinLink: profile?.linkedinLink,
      xLink: profile?.xLink,
      codeforcesLink: profile?.codeforcesLink,
      leetcodeLink: profile?.leetcodeLink,
      collegeName: profile?.collegeName,
      companyName: profile?.companyName,
      isPlaced: profile?.isPlaced,
      profileImageUrl: profile?.profileImageUrl,
      hasCompletedProfile: user.hasCompletedProfile,
    };

    res.status(200).json(profileData);
  } catch (error) {
    logger.error(`Get profile error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error getting profile' });
  }
};

// Delete user account
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId; // userId set by auth middleware
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { reason, feedback } = req.body;

    if (!reason) {
      res.status(400).json({ message: 'Deletion reason is required' });
      return;
    }

    // Get user before deletion
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Create account deletion record
    const accountDeletion = new AccountDeletion({
      userId,
      username: user.username,
      email: user.email,
      reason,
      feedback
    });

    await accountDeletion.save();

    // Mark user as deleted
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    // Delete profile
    await Profile.deleteOne({ userId });

    logger.info(`Account deleted for user ${userId} with reason: ${reason}`);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error(`Account deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({ message: 'Error deleting account' });
  }
};

