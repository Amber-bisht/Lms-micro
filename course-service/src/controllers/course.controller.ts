import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Lesson from '../models/Lesson';
import { logger } from '../utils/logger';
import axios from 'axios';
import config from '../config/config';

// Get all courses
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if this is an admin request (from admin dashboard)
    const isAdminRequest = req.headers['x-admin-request'] === 'true' || 
                          req.path.includes('/admin') ||
                          req.query.admin === 'true';
    
    const query = isAdminRequest ? {} : { isPublished: true };
    const courses = await Course.find(query);
    res.status(200).json(courses);
  } catch (error) {
    logger.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

// Get course by ID or slug
export const getCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    let course = null;
    
    // Try to find by ID first if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      course = await Course.findById(id);
    }
    
    // If not found by ID, try by slug
    if (!course) {
      course = await Course.findOne({ slug: id });
    }
    
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    res.status(200).json(course);
  } catch (error) {
    logger.error('Error fetching course:', error);
    res.status(500).json({ message: 'Error fetching course' });
  }
};

// Enroll in a course
export const enrollInCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { userId, email, username } = req.body;
    
    if (!userId) {
      res.status(401).json({ message: 'User ID is required' });
      return;
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ userId, courseId });
    if (existingEnrollment) {
      res.status(400).json({ message: 'User is already enrolled in this course' });
      return;
    }
    
    // Get course info
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      userId,
      courseId,
      progress: 0,
      isCompleted: false,
      completedLessons: [],
    });
    
    await enrollment.save();
    logger.info(`User ${userId} enrolled in course ${courseId}`);
    
    
    
    res.status(201).json(enrollment);
  } catch (error) {
    logger.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Error enrolling in course' });
  }
};

// Get enrollment status
export const getEnrollmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      res.status(401).json({ message: 'User ID is required' });
      return;
    }
    
    const enrollment = await Enrollment.findOne({ userId, courseId });
    
    if (!enrollment) {
      res.status(404).json({ enrolled: false });
      return;
    }
    
    res.status(200).json({ enrolled: true, enrollment });
  } catch (error) {
    logger.error('Error checking enrollment status:', error);
    res.status(500).json({ message: 'Error checking enrollment status' });
  }
};

// Enroll in a course by slug
export const enrollInCourseBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { userId, email, username } = req.body;
    
    if (!userId) {
      res.status(401).json({ message: 'User ID is required' });
      return;
    }
    
    // Find course by slug
    const course = await Course.findOne({ slug });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ userId, courseId: course._id });
    if (existingEnrollment) {
      res.status(400).json({ message: 'User is already enrolled in this course' });
      return;
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      userId,
      courseId: course._id,
      progress: 0,
      isCompleted: false,
      completedLessons: [],
    });
    
    await enrollment.save();
    logger.info(`User ${userId} enrolled in course ${course._id} (slug: ${slug})`);
    
    res.status(201).json(enrollment);
  } catch (error) {
    logger.error('Error enrolling in course by slug:', error);
    res.status(500).json({ message: 'Error enrolling in course' });
  }
};

// Get enrollment status by slug
export const getEnrollmentStatusBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      res.status(401).json({ message: 'User ID is required' });
      return;
    }
    
    // Find course by slug
    const course = await Course.findOne({ slug });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
    
    if (!enrollment) {
      res.status(404).json({ enrolled: false });
      return;
    }
    
    res.status(200).json({ enrolled: true, enrollment });
  } catch (error) {
    logger.error('Error checking enrollment status by slug:', error);
    res.status(500).json({ message: 'Error checking enrollment status' });
  }
};

// Get user enrollments
export const getUserEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const enrollments = await Enrollment.find({ userId }).populate('courseId').sort({ enrolledAt: -1 });
    res.status(200).json(enrollments);
  } catch (error) {
    logger.error('Error fetching user enrollments:', error);
    res.status(500).json({ message: 'Error fetching user enrollments' });
  }
};

// Complete course
export const completeCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { userId, email, username } = req.body;
    
    if (!userId) {
      res.status(401).json({ message: 'User ID is required' });
      return;
    }
    
    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    // Mark course as completed
    enrollment.progress = 100;
    enrollment.isCompleted = true;
    enrollment.updatedAt = new Date();
    
    await enrollment.save();
    logger.info(`User ${userId} completed course ${courseId}`);
    
    
    res.status(200).json({ message: 'Course completed successfully!', enrollment });
  } catch (error) {
    logger.error('Error completing course:', error);
    res.status(500).json({ message: 'Error completing course' });
  }
};

// Update lesson progress
export const updateLessonProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, lessonId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      res.status(401).json({ message: 'User ID is required' });
      return;
    }
    
    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }
    
    // Add lesson to completed lessons if not already there
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }
    
    // Calculate progress
    const course = await Course.findById(courseId);
    if (course && course.lessonCount > 0) {
      enrollment.progress = Math.round((enrollment.completedLessons.length / course.lessonCount) * 100);
    }
    
    enrollment.updatedAt = new Date();
    await enrollment.save();
    
    res.status(200).json(enrollment);
  } catch (error) {
    logger.error('Error updating lesson progress:', error);
    res.status(500).json({ message: 'Error updating lesson progress' });
  }
};

// ============== COURSE CRUD OPERATIONS ==============

// Create new course (admin only)
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, slug, instructorId, thumbnail, videoLinks, isPublished } = req.body;
    
    // Check if slug already exists
    const existingCourse = await Course.findOne({ slug });
    if (existingCourse) {
      res.status(400).json({ message: 'Course with this slug already exists' });
      return;
    }
    
    const course = new Course({
      title,
      description,
      slug,
      instructorId,
      thumbnail,
      videoLinks: videoLinks || [],
      isPublished: isPublished || false,
      lessonCount: 0,
      rating: 0,
      reviewCount: 0,
    });
    
    await course.save();
    logger.info(`Course created: ${course._id}`);
    
    res.status(201).json(course);
  } catch (error) {
    logger.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course' });
  }
};

// Update course (admin only)
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, slug, instructorId, thumbnail, videoLinks, isPublished } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid course ID' });
      return;
    }
    
    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    // If slug is changing, check if new slug is available
    if (slug && slug !== course.slug) {
      const existingCourse = await Course.findOne({ slug });
      if (existingCourse) {
        res.status(400).json({ message: 'Course with this slug already exists' });
        return;
      }
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        title: title || course.title,
        description: description || course.description,
        slug: slug || course.slug,
        instructorId: instructorId || course.instructorId,
        thumbnail: thumbnail !== undefined ? thumbnail : course.thumbnail,
        videoLinks: videoLinks || course.videoLinks,
        isPublished: isPublished !== undefined ? isPublished : course.isPublished,
      },
      { new: true }
    );
    
    logger.info(`Course updated: ${id}`);
    res.status(200).json(updatedCourse);
  } catch (error) {
    logger.error('Error updating course:', error);
    res.status(500).json({ message: 'Error updating course' });
  }
};

// Delete course (admin only)
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid course ID' });
      return;
    }
    
    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    // Delete all lessons for this course
    await Lesson.deleteMany({ courseId: id });
    
    // Delete all enrollments for this course
    await Enrollment.deleteMany({ courseId: id });
    
    // Delete the course
    await Course.findByIdAndDelete(id);
    
    logger.info(`Course deleted: ${id}`);
    res.status(200).json({ message: 'Course and associated data deleted successfully' });
  } catch (error) {
    logger.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course' });
  }
};

// Update course rating (called by community service)
export const updateCourseRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, reviewCount } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid course ID' });
      return;
    }
    
    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    // Update rating and review count
    course.rating = rating || 0;
    course.reviewCount = reviewCount || 0;
    course.updatedAt = new Date();
    
    await course.save();
    
    logger.info(`Course rating updated: ${id} - Rating: ${rating}, Reviews: ${reviewCount}`);
    res.status(200).json({ message: 'Course rating updated successfully', course });
  } catch (error) {
    logger.error('Error updating course rating:', error);
    res.status(500).json({ message: 'Error updating course rating' });
  }
};

// ============== LESSON MANAGEMENT ==============

// Get lessons by course ID
export const getLessonsByCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ message: 'Invalid course ID' });
      return;
    }
    
    const lessons = await Lesson.find({ courseId }).sort({ order: 1 });
    res.status(200).json(lessons);
  } catch (error) {
    logger.error('Error fetching lessons:', error);
    res.status(500).json({ message: 'Error fetching lessons' });
  }
};

// Get lesson by ID
export const getLessonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid lesson ID' });
      return;
    }
    
    const lesson = await Lesson.findById(id).populate('course');
    if (!lesson) {
      res.status(404).json({ message: 'Lesson not found' });
      return;
    }
    
    res.status(200).json(lesson);
  } catch (error) {
    logger.error('Error fetching lesson:', error);
    res.status(500).json({ message: 'Error fetching lesson' });
  }
};

// Create new lesson (admin only)
export const createLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { title, description, content, videoId, order } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ message: 'Invalid course ID' });
      return;
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    
    const lesson = new Lesson({
      title,
      description,
      content,
      videoId,
      courseId,
      order: order || (await Lesson.countDocuments({ courseId })) + 1,
    });
    
    await lesson.save();
    logger.info(`Lesson created: ${lesson._id} for course ${courseId}`);
    
    res.status(201).json(lesson);
  } catch (error) {
    logger.error('Error creating lesson:', error);
    res.status(500).json({ message: 'Error creating lesson' });
  }
};

// Update lesson (admin only)
export const updateLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, content, videoId, order } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid lesson ID' });
      return;
    }
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      res.status(404).json({ message: 'Lesson not found' });
      return;
    }
    
    const updatedLesson = await Lesson.findByIdAndUpdate(
      id,
      {
        title: title || lesson.title,
        description: description || lesson.description,
        content: content || lesson.content,
        videoId: videoId !== undefined ? videoId : lesson.videoId,
        order: order || lesson.order,
      },
      { new: true }
    );
    
    logger.info(`Lesson updated: ${id}`);
    res.status(200).json(updatedLesson);
  } catch (error) {
    logger.error('Error updating lesson:', error);
    res.status(500).json({ message: 'Error updating lesson' });
  }
};

// Delete lesson (admin only)
export const deleteLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid lesson ID' });
      return;
    }
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      res.status(404).json({ message: 'Lesson not found' });
      return;
    }
    
    const courseId = lesson.courseId;
    await Lesson.findByIdAndDelete(id);
    
    // Reorder remaining lessons
    const lessons = await Lesson.find({ courseId }).sort({ order: 1 });
    for (let i = 0; i < lessons.length; i++) {
      await Lesson.findByIdAndUpdate(lessons[i]._id, { order: i + 1 });
    }
    
    logger.info(`Lesson deleted: ${id}`);
    res.status(200).json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    logger.error('Error deleting lesson:', error);
    res.status(500).json({ message: 'Error deleting lesson' });
  }
};
