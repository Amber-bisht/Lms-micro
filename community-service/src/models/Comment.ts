import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  user: string | mongoose.Types.ObjectId;
  course: string | mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const CommentSchema: Schema = new Schema<IComment>({
  user: { type: Schema.Types.Mixed, ref: 'User', required: true },
  course: { type: Schema.Types.Mixed, ref: 'Course', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IComment>('Comment', CommentSchema);

