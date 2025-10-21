import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  description: string;
  content: string;
  youtubeUrl?: string;
  courseId: mongoose.Types.ObjectId;
  order: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters']
  },
  description: { 
    type: String,
    required: [true, 'Description is required']
  },
  content: { 
    type: String,
    required: [true, 'Content is required']
  },
  youtubeUrl: { 
    type: String
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    default: 0
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required in minutes'],
    min: [1, 'Duration must be at least 1 minute']
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

lessonSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true
});

// Add post-save hook to update course lesson count
lessonSchema.post('save', async function(doc) {
  try {
    const Course = mongoose.model('Course');
    const count = await mongoose.model('Lesson').countDocuments({ courseId: doc.courseId });
    await Course.findByIdAndUpdate(doc.courseId, { lessonCount: count });
  } catch (error) {
    console.error('Error updating course lesson count:', error);
  }
});

// Add post-delete hook to update course lesson count
lessonSchema.post('deleteOne', async function(doc: any) {
  try {
    const Course = mongoose.model('Course');
    const count = await mongoose.model('Lesson').countDocuments({ courseId: doc.courseId });
    await Course.findByIdAndUpdate(doc.courseId, { lessonCount: count });
  } catch (error) {
    console.error('Error updating course lesson count:', error);
  }
});

export default mongoose.model<ILesson>('Lesson', lessonSchema);

