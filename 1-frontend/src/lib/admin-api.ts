// Admin API service for frontend
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ==================== COURSE MANAGEMENT APIs ====================

/**
 * Get all courses
 */
export const getAllCourses = async () => {
  const response = await apiGet('/api/courses?admin=true');
  return response.json();
};

/**
 * Get course by ID or slug
 */
export const getCourse = async (id: string) => {
  const response = await apiGet(`/api/courses/${id}`);
  return response.json();
};

/**
 * Create new course
 */
export const createCourse = async (courseData: {
  title: string;
  description: string;
  slug: string;
  instructorId?: string;
  thumbnail?: string;
  videoLinks?: string[];
  isPublished?: boolean;
}) => {
  const response = await apiPost('/api/courses/create', { ...courseData, instructorId: courseData.instructorId || 'admin' });
  return response.json();
};

/**
 * Update course
 */
export const updateCourse = async (id: string, courseData: {
  title?: string;
  description?: string;
  slug?: string;
  instructorId?: string;
  thumbnail?: string;
  videoLinks?: string[];
  isPublished?: boolean;
}) => {
  const response = await apiPut(`/api/courses/${id}`, courseData);
  return response.json();
};

/**
 * Delete course
 */
export const deleteCourse = async (id: string) => {
  const response = await apiDelete(`/api/courses/${id}`);
  return response.json();
};

// ==================== LESSON MANAGEMENT APIs ====================

/**
 * Get lessons by course ID
 */
export const getLessonsByCourse = async (courseId: string) => {
  const response = await apiGet(`/api/courses/${courseId}/lessons`);
  return response.json();
};

/**
 * Get lesson by ID
 */
export const getLessonById = async (id: string) => {
  const response = await apiGet(`/api/lessons/${id}`);
  return response.json();
};

/**
 * Create new lesson
 */
export const createLesson = async (courseId: string, lessonData: {
  title: string;
  description: string;
  content: string;
  videoId?: string;
  order: number;
}) => {
  const response = await apiPost(`/api/courses/${courseId}/lessons`, lessonData);
  return response.json();
};

/**
 * Update lesson
 */
export const updateLesson = async (id: string, lessonData: {
  title?: string;
  description?: string;
  content?: string;
  videoId?: string;
  order?: number;
}) => {
  const response = await apiPut(`/api/lessons/${id}`, lessonData);
  return response.json();
};

/**
 * Delete lesson
 */
export const deleteLesson = async (id: string) => {
  const response = await apiDelete(`/api/lessons/${id}`);
  return response.json();
};

// ==================== VIDEO MANAGEMENT APIs ====================

/**
 * Get all videos
 */
export const getAllVideos = async () => {
  const response = await apiGet('/api/videos');
  return response.json();
};

/**
 * Upload video file
 */
export const uploadVideo = async (formData: FormData) => {
  const response = await apiPost('/api/videos/upload', formData);
  return response.json();
};

/**
 * Add YouTube video
 */
export const addYouTubeVideo = async (videoData: {
  title: string;
  youtubeUrl: string;
}) => {
  const response = await apiPost('/api/videos/youtube', videoData);
  return response.json();
};

/**
 * Add external HLS video
 */
export const addExternalHLSVideo = async (videoData: {
  title: string;
  hlsUrl: string;
}) => {
  const response = await apiPost('/api/videos/external-hls', videoData);
  return response.json();
};

/**
 * Delete video
 */
export const deleteVideo = async (id: string) => {
  const response = await apiDelete(`/api/videos/${id}`);
  return response.json();
};

/**
 * Get video by ID
 */
export const getVideoById = async (id: string) => {
  const response = await apiGet(`/api/videos/${id}`);
  return response.json();
};

// ==================== USER MANAGEMENT APIs ====================

/**
 * Get all users
 */
export const getAllUsers = async () => {
  const response = await apiGet('/api/auth/users');
  return response.json();
};

/**
 * Ban user
 */
export const banUser = async (id: string, banData: {
  reason: string;
  duration?: number;
}) => {
  const response = await apiPut(`/api/auth/users/${id}/ban`, banData);
  return response.json();
};

/**
 * Unban user
 */
export const unbanUser = async (id: string) => {
  const response = await apiDelete(`/api/auth/unban-user/${id}`);
  return response.json();
};

/**
 * Get user profile
 */
export const getUserProfile = async (id: string) => {
  const response = await apiGet(`/api/auth/users/${id}/profile`);
  return response.json();
};

/**
 * Get user enrollments
 */
export const getUserEnrollments = async (id: string) => {
  const response = await apiGet(`/api/auth/users/${id}/enrollments`);
  return response.json();
};

/**
 * Get user activity
 */
export const getUserActivity = async (id: string) => {
  const response = await apiGet(`/api/auth/users/${id}/activity`);
  return response.json();
};

// ==================== SYSTEM MANAGEMENT APIs ====================

/**
 * Get system statistics
 */
export const getSystemStats = async () => {
  const response = await apiGet('/api/admin/stats');
  return response.json();
};

/**
 * Get Redis keys
 */
export const getRedisKeys = async (pattern: string = '*') => {
  const response = await apiGet(`/api/admin/redis/keys?pattern=${pattern}`);
  return response.json();
};

/**
 * Get Redis value
 */
export const getRedisValue = async (key: string) => {
  const response = await apiGet(`/api/admin/redis/key/${key}`);
  return response.json();
};

/**
 * Delete Redis key
 */
export const deleteRedisKey = async (key: string) => {
  const response = await apiDelete(`/api/admin/redis/key/${key}`);
  return response.json();
};

/**
 * Flush Redis cache
 */
export const flushRedisCache = async () => {
  const response = await apiPost('/api/admin/redis/flush');
  return response.json();
};

/**
 * Get Redis info
 */
export const getRedisInfo = async () => {
  const response = await apiGet('/api/admin/redis/info');
  return response.json();
};

/**
 * Clear cache by pattern
 */
export const clearCacheByPattern = async (pattern: string) => {
  const response = await apiPost('/api/admin/redis/clear-pattern', { pattern });
  return response.json();
};

// ==================== SECURITY MANAGEMENT APIs ====================

/**
 * Get blocked IPs
 */
export const getBlockedIPs = async () => {
  const response = await apiGet('/api/auth/blocked-ips');
  return response.json();
};

/**
 * Ban IP address
 */
export const banIP = async (banData: {
  ip: string;
  reason: string;
  duration?: number;
}) => {
  const response = await apiPost('/api/auth/ban-ip', banData);
  return response.json();
};

/**
 * Unban IP address
 */
export const unbanIP = async (ip: string) => {
  const response = await apiDelete(`/api/auth/unban-ip/${ip}`);
  return response.json();
};

/**
 * Get rate limits
 */
export const getRateLimits = async () => {
  const response = await apiGet('/api/auth/rate-limits');
  return response.json();
};

/**
 * Get permanent bans
 */
export const getPermanentBans = async () => {
  const response = await apiGet('/api/auth/permanent-bans');
  return response.json();
};

// ==================== COMMENT MANAGEMENT APIs ====================

/**
 * Get comments for course
 */
export const getCommentsForCourse = async (courseId: string, page: number = 1, limit: number = 10) => {
  const response = await apiGet(`/api/comments/${courseId}?page=${page}&limit=${limit}`);
  return response.json();
};

/**
 * Delete comment (admin)
 */
export const deleteComment = async (commentId: string) => {
  const response = await apiDelete(`/api/admin/comments/${commentId}`);
  return response.json();
};

// ==================== ENROLLMENT MANAGEMENT APIs ====================

/**
 * Get enrollment status
 */
export const getEnrollmentStatus = async (courseId: string, userId: string) => {
  const response = await apiGet(`/api/courses/${courseId}/enrollment-status?userId=${userId}`);
  return response.json();
};

/**
 * Enroll in course
 */
export const enrollInCourse = async (courseId: string, userData: {
  userId: string;
  email: string;
  username: string;
}) => {
  const response = await apiPost(`/api/courses/${courseId}/enroll`, userData);
  return response.json();
};

/**
 * Complete course
 */
export const completeCourse = async (courseId: string, userData: {
  userId: string;
  email: string;
  username: string;
}) => {
  const response = await apiPost(`/api/courses/${courseId}/complete`, userData);
  return response.json();
};

/**
 * Update lesson progress
 */
export const updateLessonProgress = async (courseId: string, lessonId: string, userData: {
  userId: string;
}) => {
  const response = await apiPost(`/api/courses/${courseId}/lessons/${lessonId}/progress`, userData);
  return response.json();
};
