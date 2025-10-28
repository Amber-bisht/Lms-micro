import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { reviewController } from '../controllers/review.controller';

const router = Router();

// Comment routes
router.get('/comments/:id', commentController.getComments);
router.post('/comments/:id', commentController.addComment);
router.delete('/comments/:commentId', commentController.deleteComment);

// Review routes
router.get('/reviews/course/:courseId', reviewController.getCourseReviews);
router.get('/reviews/course/:courseId/user/:userId', reviewController.getUserReview);
router.post('/reviews', reviewController.createReview);
router.put('/reviews/:id', reviewController.updateReview);
router.delete('/reviews/:id', reviewController.deleteReview);

// Testimonials (special view of reviews)
router.get('/testimonials', reviewController.getTestimonials);

export default router;

