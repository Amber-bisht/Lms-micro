import { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import Comment from '../models/Comment';
import { filterBadWords, containsURL, generateDisplayUsername } from '../utils/commentUtils';
import { logger } from '../utils/logger';
import config from '../config/config';

// Helper function to get course ID from slug or ID
async function getCourseId(courseSlugOrId: string): Promise<string | null> {
  try {
    // If it's already a valid ObjectId, return it
    if (courseSlugOrId.length === 24 && /^[0-9a-fA-F]{24}$/.test(courseSlugOrId)) {
      return courseSlugOrId;
    }

    // Otherwise, try to find the course by slug or ID via course service API
    // The course service handles both slugs and IDs in the same endpoint
    const courseServiceUrl = `${config.COURSE_SERVICE_URL}/api/courses/${courseSlugOrId}`;

    logger.info(`[GET COURSE ID] Looking up course: ${courseSlugOrId} via ${courseServiceUrl}`);

    const response = await axios.get(courseServiceUrl, { timeout: 5000 });

    if (response.data && response.data._id) {
      logger.info(`[GET COURSE ID] Found course: ${courseSlugOrId} -> ${response.data._id}`);
      return response.data._id;
    }

    logger.warn(`[GET COURSE ID] Course not found: ${courseSlugOrId}`);
    return null;
  } catch (error: any) {
    logger.error(`[GET COURSE ID] Error finding course: ${courseSlugOrId}`, error.message);

    // If it's a valid ObjectId format, try using it directly as fallback
    if (courseSlugOrId.length === 24 && /^[0-9a-fA-F]{24}$/.test(courseSlugOrId)) {
      logger.info(`[GET COURSE ID] Using as ObjectId fallback: ${courseSlugOrId}`);
      return courseSlugOrId;
    }

    return null;
  }
}

export const commentController = {
  async getComments(req: Request, res: Response) {
    try {
      const courseSlugOrId = req.params.id;

      // Get the actual course ID from slug or ID
      const courseId = await getCourseId(courseSlugOrId);
      if (!courseId) {
        logger.warn(`[GET COMMENTS] Course not found: ${courseSlugOrId}`);
        return res.status(404).json({
          error: 'Course not found',
          courseSlugOrId: courseSlugOrId
        });
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const skip = (page - 1) * limit;

      logger.info(`[GET COMMENTS] Fetching comments for course: ${courseSlugOrId} (ID: ${courseId}), page: ${page}, limit: ${limit}`);

      // Find comments for the course
      let comments;
      try {
        comments = await Comment.find({ course: courseId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
      } catch (dbError: any) {
        logger.error(`[GET COMMENTS] Database query error: ${dbError.message}`, dbError);
        throw dbError;
      }

      logger.info(`[GET COMMENTS] Found ${comments.length} comments for course: ${courseSlugOrId}`);

      const mappedComments = comments.map((c: any) => ({
        _id: c._id,
        user: {
          username: generateDisplayUsername(c.user),
          _id: c.user?._id,
        },
        course: c.course,
        content: c.content,
        createdAt: c.createdAt,
      }));

      // Return array directly for backward compatibility with frontend
      res.json(mappedComments);
    } catch (err: any) {
      logger.error('[GET COMMENTS] Error fetching comments:', {
        error: err.message,
        stack: err.stack,
        courseSlugOrId: req.params.id
      });
      res.status(500).json({
        error: 'Failed to fetch comments',
        message: err.message || 'Internal server error'
      });
    }
  },

  async addComment(req: Request, res: Response) {
    logger.info(`[ADD COMMENT] Received request for course: ${req.params.id}`);
    logger.info(`[ADD COMMENT] Request body: ${JSON.stringify(req.body)}`);
    logger.info(`[ADD COMMENT] Headers: ${JSON.stringify(req.headers)}`);

    try {
      const courseSlugOrId = req.params.id;

      // Get the actual course ID from slug or ID
      const courseId = await getCourseId(courseSlugOrId);
      if (!courseId) {
        logger.warn(`[ADD COMMENT] Course not found: ${courseSlugOrId}`);
        return res.status(404).json({
          error: 'Course not found',
          courseSlugOrId: courseSlugOrId
        });
      }

      const userId = req.body.userId || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const isAnonymous = userId === 'anonymous';
      if (isAnonymous) {
        logger.info(`[ADD COMMENT] Anonymous comment for course: ${courseSlugOrId}`);
      } else {
        logger.info(`[ADD COMMENT] Authenticated comment for course: ${courseSlugOrId}, user: ${userId}`);
      }

      let { content } = req.body;

      // Only check comment limit for authenticated users
      if (!isAnonymous) {
        const userCommentsCount = await Comment.countDocuments({ user: userId, course: courseId });
        if (userCommentsCount >= 5) {
          return res.status(400).json({ error: 'You can only add up to 5 comments per course.' });
        }
      }

      if (containsURL(content)) {
        return res.status(400).json({ error: 'Comments cannot contain URLs.' });
      }

      content = filterBadWords(content);

      const comment = new Comment({ user: userId, course: courseId, content });
      await comment.save();

      logger.info(`[ADD COMMENT] Comment created successfully: ${comment._id}`);

      res.status(201).json({
        ...comment.toObject(),
        rateLimitInfo: {
          remainingAttempts: 9,
          limit: 10
        }
      });
    } catch (err) {
      logger.error('Error adding comment:', err);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  },

  async deleteComment(req: Request, res: Response) {
    try {
      const commentId = req.params.commentId;
      const userId = req.body.userId || (req as any).user?._id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.user.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'Unauthorized to delete this comment' });
      }

      await Comment.findByIdAndDelete(commentId);
      res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
      logger.error('Error deleting comment:', err);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
};

