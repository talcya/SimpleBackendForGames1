import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStorage extends Document {
  user: mongoose.Types.ObjectId;
  key: string;
  data: Record<string, unknown>;
  meta?: {
    version?: number;
    tags?: string[];
    lastUpdatedBy?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserStorageSchema = new Schema<IUserStorage>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    meta: {
      version: { type: Number, default: 1 },
      tags: [{ type: String }],
      lastUpdatedBy: { type: String },
    },
  },
  { timestamps: true }
);

// Unique per user + key
UserStorageSchema.index({ user: 1, key: 1 }, { unique: true });

// Optional TTL helper (commented): expire entries by updatedAt if desired
// UserStorageSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // 7 days

export const UserStorageModel = mongoose.models.UserStorage || mongoose.model<IUserStorage>('UserStorage', UserStorageSchema);

export default UserStorageModel;
