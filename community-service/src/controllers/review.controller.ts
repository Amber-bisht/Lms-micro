import { Request, Response } from 'express';
import Review from '../models/Review';
import { logger } from '../utils/logger';
import axios from 'axios';
import config from '../config/config';

export const reviewController = {
  async getCourseReviews(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const reviews = await Review.find({ courseId }).sort({ createdAt: -1 });
      res.json(reviews);
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Error fetching reviews' });
    }
  },

  async getUserReview(req: Request, res: Response) {
    try {
      const { courseId, userId } = req.params;
      const review = await Review.findOne({ courseId, userId });
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      res.json(review);
    } catch (error) {
      logger.error('Error fetching user review:', error);
      res.status(500).json({ message: 'Error fetching review' });
    }
  },

  async createReview(req: Request, res: Response) {
    try {
      const { courseId, userId, rating, comment } = req.body;

      if (!userId || !courseId || !rating) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      const existingReview = await Review.findOne({ courseId, userId });
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this course' });
      }

      const review = new Review({
        userId,
        courseId,
        rating,
        comment: comment || ''
      });

      await review.save();

      // Update course average rating
      await updateCourseRating(courseId);

      logger.info(`Review created for course ${courseId} by user ${userId}`);
      res.status(201).json(review);
    } catch (error) {
      logger.error('Error creating review:', error);
      res.status(500).json({ message: 'Error creating review' });
    }
  },

  async updateReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      review.updatedAt = new Date();

      await review.save();

      // Update course average rating
      await updateCourseRating(review.courseId.toString());

      logger.info(`Review ${id} updated`);
      res.json(review);
    } catch (error) {
      logger.error('Error updating review:', error);
      res.status(500).json({ message: 'Error updating review' });
    }
  },

  async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const review = await Review.findByIdAndDelete(id);

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Update course average rating
      await updateCourseRating(review.courseId.toString());

      logger.info(`Review ${id} deleted`);
      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      logger.error('Error deleting review:', error);
      res.status(500).json({ message: 'Error deleting review' });
    }
  },

  async getTestimonials(req: Request, res: Response) {
    try {
      // Testimonials are reviews with rating >= 4
      const testimonials = await Review.find({ rating: { $gte: 4 } })
        .sort({ rating: -1, createdAt: -1 })
        .limit(10);
      
      res.json(testimonials);
    } catch (error) {
      logger.error('Error fetching testimonials:', error);
      res.status(500).json({ message: 'Error fetching testimonials' });
    }
  }
};

async function updateCourseRating(courseId: string) {
  try {
    const reviews = await Review.find({ courseId });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalRating / reviews.length;
      
      // Call Course Service to update rating
      await axios.patch(`${config.COURSE_SERVICE_URL}/api/courses/${courseId}/rating`, {
        rating: avgRating,
        reviewCount: reviews.length
      });
    } else {
      // No reviews, reset rating
      await axios.patch(`${config.COURSE_SERVICE_URL}/api/courses/${courseId}/rating`, {
        rating: 0,
        reviewCount: 0
      });
    }
  } catch (error) {
    logger.error('Error updating course rating:', error);
  }
}

