import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoSession extends Document {
  videoId: string;
  courseId: string;
  userId: string;
  token: string;
  embedUrl: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

const videoSessionSchema = new Schema<IVideoSession>({
  videoId: { 
    type: String, 
    required: true,
    index: true 
  },
  courseId: { 
    type: String, 
    required: true,
    index: true 
  },
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  token: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  embedUrl: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, {
  timestamps: true,
});

videoSessionSchema.index({ token: 1 });
videoSessionSchema.index({ userId: 1, courseId: 1 });
videoSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IVideoSession>('VideoSession', videoSessionSchema);
