import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  userId: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  thumbnail?: string;
  isPublic: boolean;
  uploadedAt: Date;
  // S3 specific fields
  s3Key?: string;
  s3Bucket?: string;
  storageType: 'local' | 's3';
}

const fileSchema = new Schema<IFile>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
    unique: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  // S3 specific fields
  s3Key: {
    type: String,
  },
  s3Bucket: {
    type: String,
  },
  storageType: {
    type: String,
    enum: ['local', 's3'],
    default: 'local',
  },
}, {
  timestamps: true,
});

fileSchema.index({ userId: 1, uploadedAt: -1 });

export default mongoose.model<IFile>('File', fileSchema);

