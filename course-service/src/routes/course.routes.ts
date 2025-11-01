import { Router } from 'express';
import * as courseController from '../controllers/course.controller';

const router = Router();

// ============== PUBLIC COURSE ENDPOINTS ==============
router.get('/', courseController.getAllCourses);

// ============== COURSE CRUD (ADMIN) ==============
// Note: Admin authentication should be handled by the API Gateway
router.post('/create', courseController.createCourse);

// ============== LESSON MANAGEMENT ==============
// Public lesson endpoints (must come before generic :id routes)
router.get('/:courseId/lessons', courseController.getLessonsByCourse);
router.get('/lessons/:id', courseController.getLessonById);

// ============== RATING ENDPOINTS ==============
router.patch('/:id/rating', courseController.updateCourseRating);

// ============== ENROLLMENT ENDPOINTS ==============
router.post('/:courseId/enroll', courseController.enrollInCourse);
router.get('/:courseId/enrollment', courseController.getEnrollmentStatus);
router.get('/:courseId/completion', courseController.getCompletionStatus);
router.post('/:courseId/complete', courseController.completeCourse);
router.post('/:courseId/lessons/:lessonId/progress', courseController.updateLessonProgress);

// Slug-based enrollment endpoints
router.post('/slug/:slug/enroll', courseController.enrollInCourseBySlug);
router.get('/slug/:slug/enrollment', courseController.getEnrollmentStatusBySlug);
router.get('/slug/:slug/lessons/:lessonId', courseController.getLessonBySlugAndId);

// User enrollment history
router.get('/user/:userId/enrollments', courseController.getUserEnrollments);

// ============== COURSE CRUD (ADMIN) - MUST COME AFTER SPECIFIC ROUTES ==============
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// Get video playback URL by course slug and lesson ID (simplified endpoint)
// MUST BE LAST - most generic route
router.get('/:slug/:lessonId', courseController.getVideoPlaybackUrl);

// Get course by ID or slug - MUST BE VERY LAST
router.get('/:id', courseController.getCourse);

// Admin lesson endpoints
// Note: Admin authentication should be handled by the API Gateway
router.post('/:courseId/lessons', courseController.createLesson);
router.put('/lessons/:id', courseController.updateLesson);
router.delete('/lessons/:id', courseController.deleteLesson);

export default router;
