import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoLink {
  title: string;
  url: string;
  type: 'youtube';
}

export interface ICourse extends Document {
  title: string;
  description: string;
  slug: string;
  instructorId: string;
  lessonCount: number;
  rating: number;
  thumbnail?: string;
  videoLinks?: IVideoLink[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  instructorId: { type: String, required: true },
  lessonCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  thumbnail: { type: String },
  videoLinks: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['youtube'],
      default: 'youtube'
    }
  }],
  isPublished: { type: Boolean, default: false },
}, {
  timestamps: true,
});

courseSchema.index({ slug: 1 });
courseSchema.index({ isPublished: 1 });

export default mongoose.model<ICourse>('Course', courseSchema);

