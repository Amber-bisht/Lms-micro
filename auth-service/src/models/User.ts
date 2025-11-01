import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  fullName?: string;
  bio?: string;
  interest?: string;
  profileImageUrl?: string;
  avatar?: string;
  collegeName?: string;
  companyName?: string;
  isPlaced?: boolean;
  githubLink?: string;
  linkedinLink?: string;
  xLink?: string;
  codeforcesLink?: string;
  leetcodeLink?: string;
  isAdmin: boolean;
  hasCompletedProfile: boolean;
  role: 'user' | 'admin' | 'instructor';
  banned: boolean;
  googleId?: string;
  githubId?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  fullName: { type: String },
  bio: { type: String },
  interest: { type: String },
  profileImageUrl: { type: String },
  avatar: { type: String },
  collegeName: { type: String },
  companyName: { type: String },
  isPlaced: { type: Boolean, default: false },
  githubLink: { type: String },
  linkedinLink: { type: String },
  xLink: { type: String },
  codeforcesLink: { type: String },
  leetcodeLink: { type: String },
  isAdmin: { type: Boolean, default: false },
  hasCompletedProfile: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin', 'instructor'], default: 'user' },
  banned: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true },
  githubId: { type: String, unique: true, sparse: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', userSchema);

