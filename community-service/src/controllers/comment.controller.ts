import { Request, Response } from 'express';
import Comment from '../models/Comment';
import { filterBadWords, containsURL, generateDisplayUsername } from '../utils/commentUtils';
import { logger } from '../utils/logger';

export const commentController = {
  async getComments(req: Request, res: Response) {
    try {
      const courseId = req.params.id;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const skip = (page - 1) * limit;

      const comments = await Comment.find({ course: courseId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

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

      res.json(mappedComments);
    } catch (err) {
      logger.error('Error fetching comments:', err);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  },

  async addComment(req: Request, res: Response) {
    try {
      const courseId = req.params.id;
      const userId = req.body.userId || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      let { content } = req.body;

      const userCommentsCount = await Comment.countDocuments({ user: userId, course: courseId });
      if (userCommentsCount >= 5) {
        return res.status(400).json({ error: 'You can only add up to 5 comments per course.' });
      }

      if (containsURL(content)) {
        return res.status(400).json({ error: 'Comments cannot contain URLs.' });
      }

      content = filterBadWords(content);

      const comment = new Comment({ user: userId, course: courseId, content });
      await comment.save();

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

