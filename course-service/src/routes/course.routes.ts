import { Router } from 'express';
import * as courseController from '../controllers/course.controller';

const router = Router();

// ============== PUBLIC COURSE ENDPOINTS ==============
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);

// ============== COURSE CRUD (ADMIN) ==============
// Note: Admin authentication should be handled by the API Gateway
router.post('/create', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// ============== ENROLLMENT ENDPOINTS ==============
router.post('/:courseId/enroll', courseController.enrollInCourse);
router.get('/:courseId/enrollment', courseController.getEnrollmentStatus);
router.post('/:courseId/complete', courseController.completeCourse);
router.post('/:courseId/lessons/:lessonId/progress', courseController.updateLessonProgress);

// User enrollment history
router.get('/user/:userId/enrollments', courseController.getUserEnrollments);

// ============== LESSON MANAGEMENT ==============
// Public lesson endpoints
router.get('/:courseId/lessons', courseController.getLessonsByCourse);
router.get('/lessons/:id', courseController.getLessonById);

// Admin lesson endpoints
// Note: Admin authentication should be handled by the API Gateway
router.post('/:courseId/lessons', courseController.createLesson);
router.put('/lessons/:id', courseController.updateLesson);
router.delete('/lessons/:id', courseController.deleteLesson);

export default router;
