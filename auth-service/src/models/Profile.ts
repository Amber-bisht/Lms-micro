import mongoose, { Document, Schema } from 'mongoose';

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: { 
    type: String,
    minlength: [2, 'Full name must be at least 2 characters']
  },
  bio: { 
    type: String 
  },
  interest: { 
    type: String 
  },
  profileImageUrl: { 
    type: String 
  },
  githubLink: {
    type: String
  },
  linkedinLink: {
    type: String
  },
  xLink: {
    type: String
  },
  codeforcesLink: {
    type: String
  },
  leetcodeLink: {
    type: String
  },
  collegeName: {
    type: String
  },
  companyName: {
    type: String
  },
  isPlaced: {
    type: Boolean,
    default: false
  },
}, { 
  timestamps: true
});

export default mongoose.model<IProfile>('Profile', profileSchema);

