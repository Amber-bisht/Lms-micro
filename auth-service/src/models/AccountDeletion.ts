import mongoose, { Document, Schema } from 'mongoose';

export interface IAccountDeletion extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  email?: string;
  reason: string;
  feedback?: string;
  deletedAt: Date;
  createdAt: Date;
}

const accountDeletionSchema = new Schema<IAccountDeletion>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  username: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String 
  },
  reason: { 
    type: String, 
    required: true,
    enum: [
      'no_longer_interested',
      'found_better_platform',
      'too_many_emails',
      'privacy_concerns',
      'technical_issues',
      'not_what_expected',
      'other'
    ]
  },
  feedback: { 
    type: String 
  },
  deletedAt: { 
    type: Date, 
    default: Date.now 
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

accountDeletionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

export default mongoose.model<IAccountDeletion>('AccountDeletion', accountDeletionSchema);

