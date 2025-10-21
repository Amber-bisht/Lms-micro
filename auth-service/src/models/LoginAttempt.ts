import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginAttempt extends Document {
  ipAddress: string;
  userId?: string;
  action: string;
  attempts: number;
  isBlocked: boolean;
  blockedUntil?: Date | null;
  lastAttempt: Date;
  reason?: string;
  isPermanentBan?: boolean;
  banCategory?: string;
  bannedBy?: mongoose.Types.ObjectId;
  bannedAt?: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>({
  ipAddress: { type: String, required: true, index: true },
  userId: { type: String },
  action: { type: String, default: 'login' },
  attempts: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  blockedUntil: { type: Date },
  lastAttempt: { type: Date, default: Date.now },
  reason: { type: String },
  isPermanentBan: { type: Boolean, default: false },
  banCategory: { type: String },
  bannedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  bannedAt: { type: Date },
}, {
  timestamps: true,
});

loginAttemptSchema.index({ ipAddress: 1, action: 1 });

export default mongoose.model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);

