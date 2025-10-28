import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  userId: string;
  title: string;
  originalFilename: string;
  originalSize: number;
  originalMimetype: string;
  
  // Processing status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  
  // Original file (MP4)
  originalUrl?: string;
  originalS3Key?: string;
  
  // HLS files
  hls720Url?: string;
  hls720S3Key?: string;
  hls1080Url?: string;
  hls1080S3Key?: string;
  
  // External HLS link (for other platforms)
  externalHlsUrl?: string;
  
  // YouTube link
  youtubeUrl?: string;
  
  // Type of video
  videoType: 'upload' | 'youtube' | 'external-hls';
  
  // Storage info
  storageType: 'local' | 's3';
  s3Bucket?: string;
  
  // Metadata
  duration?: number; // in seconds
  thumbnail?: string;
  
  uploadedAt: Date;
  processedAt?: Date;
}

const videoSchema = new Schema<IVideo>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  originalFilename: {
    type: String,
    required: true,
  },
  originalSize: {
    type: Number,
    required: true,
  },
  originalMimetype: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  processingError: {
    type: String,
  },
  originalUrl: {
    type: String,
  },
  originalS3Key: {
    type: String,
  },
  hls720Url: {
    type: String,
  },
  hls720S3Key: {
    type: String,
  },
  hls1080Url: {
    type: String,
  },
  hls1080S3Key: {
    type: String,
  },
  externalHlsUrl: {
    type: String,
  },
  youtubeUrl: {
    type: String,
  },
  videoType: {
    type: String,
    enum: ['upload', 'youtube', 'external-hls'],
    default: 'upload',
    index: true,
  },
  storageType: {
    type: String,
    enum: ['local', 's3'],
    default: 'local',
  },
  s3Bucket: {
    type: String,
  },
  duration: {
    type: Number,
  },
  thumbnail: {
    type: String,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

videoSchema.index({ userId: 1, uploadedAt: -1 });
videoSchema.index({ status: 1 });
videoSchema.index({ videoType: 1, status: 1 });

export default mongoose.model<IVideo>('Video', videoSchema);

