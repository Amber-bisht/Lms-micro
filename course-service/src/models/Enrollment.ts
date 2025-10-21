import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  userId: string;
  courseId: mongoose.Types.ObjectId;
  progress: number;
  isCompleted: boolean;
  completedLessons: string[];
  enrolledAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  userId: { type: String, required: true, index: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  isCompleted: { type: Boolean, default: false },
  completedLessons: [{ type: String }],
  enrolledAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
});

// Create compound index to prevent duplicate enrollments
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);

