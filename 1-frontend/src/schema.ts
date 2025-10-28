import { z } from 'zod';

// TypeScript Interfaces (without mongoose dependencies)
export interface IUser {
  _id?: string;
  username: string;
  password?: string;
  email?: string;
  isAdmin: boolean;
  banned?: boolean;
  hasCompletedProfile: boolean;
  role?: 'user' | 'admin';
  fullName?: string;
  bio?: string;
  interest?: string;
  profileImageUrl?: string;
  githubLink?: string;
  linkedinLink?: string;
  xLink?: string;
  codeforcesLink?: string;
  leetcodeLink?: string;
  collegeName?: string;
  companyName?: string;
  isPlaced?: boolean;
  isDeleted?: boolean;
  deletionReason?: string;
  deletedAt?: Date;
  googleId?: string;
  githubId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  createdTime?: string;
}


export interface ICourse {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  instructorId: string;
  lessonCount: number;
  rating: number;
  thumbnail?: string;
  videoLinks?: Array<{ 
    title: string; 
    url: string; 
    type: 'youtube';
  }>;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields from backend
  duration?: string;
  enrollmentLink?: string;
  learningObjectives?: string[];
  level?: string;
  material?: string;
  order?: number;
  requirements?: string[];
  reviewCount?: number;
  targetAudience?: string[];
}

export interface ILesson {
  _id?: string;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string;
  duration: string;
  courseId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrollment {
  _id?: string;
  userId: string;
  courseId: string;
  progress: number;
  isCompleted: boolean;
  completedLessons: string[];
  enrolledAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id?: string;
  userId: string;
  courseId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactSubmission {
  _id?: string;
  name: string;
  email: string;
  purpose: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
  isRead: boolean;
  createdAt: Date;
}


// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6).optional(),
  email: z.string().email().optional(),
  isAdmin: z.boolean().default(false),
  hasCompletedProfile: z.boolean().default(false),
  role: z.enum(['user', 'admin']).default('user'),
  fullName: z.string().min(2).optional(),
  bio: z.string().optional(),
  interest: z.string().optional(),
  profileImageUrl: z.string().optional(),
  googleId: z.string().optional(),
  githubId: z.string().optional(),
  avatar: z.string().optional()
});

export const insertProfileSchema = z.object({
  fullName: z.string().min(2),
  bio: z.string(),
  interest: z.string(),
  profileImageUrl: z.string()
});


export const insertCourseSchema = z.object({
  title: z.string().min(3),
  slug: z.string(),
  description: z.string().min(10),
  instructorId: z.string(),
  lessonCount: z.number().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  thumbnail: z.string().optional(),
  videoLinks: z.array(z.object({
    title: z.string(),
    url: z.string(),
    type: z.enum(['youtube']).default('youtube')
  })).default([]),
  isPublished: z.boolean().default(false),
  // Additional fields
  duration: z.string().optional(),
  enrollmentLink: z.string().optional(),
  learningObjectives: z.array(z.string()).default([]),
  level: z.string().optional(),
  material: z.string().optional(),
  order: z.number().default(0),
  requirements: z.array(z.string()).default([]),
  reviewCount: z.number().min(0).default(0),
  targetAudience: z.array(z.string()).default([])
});

export const insertLessonSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.string(),
  courseId: z.string(),
  position: z.number().min(0)
});

export const insertEnrollmentSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  progress: z.number().min(0).max(100).default(0),
  isCompleted: z.boolean().default(false),
  completedLessons: z.array(z.string()).default([])
});

export const insertReviewSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});

export const insertContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  purpose: z.string(),
  message: z.string().min(10)
});


// Type exports
export type User = IUser;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Profile = Pick<IUser, 'fullName' | 'bio' | 'interest' | 'profileImageUrl'>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;


export type Course = ICourse;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Lesson = ILesson;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Enrollment = IEnrollment;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Review = IReview;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ContactSubmission = IContactSubmission;
export type InsertContactSubmission = z.infer<typeof insertContactSchema>;
