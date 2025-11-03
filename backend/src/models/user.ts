import mongoose, { Schema, Document } from 'mongoose';
import { randomBytes } from 'node:crypto';

export type Role = 'user' | 'moderator' | 'admin';

export interface IUser extends Document {
  email?: string;
  googleId?: string | null;
  displayName: string;
  avatarUrl?: string;
  passwordHash?: string | null;
  jwtVersion: number;
  refreshTokenId?: string;
  highScore: number;
  role: Role;
  inventory?: mongoose.Types.ObjectId[]; // refs to StoreItem
  friends?: { user: mongoose.Types.ObjectId; since?: Date }[];
  originalGuestId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, index: true, sparse: true },
    googleId: { type: String, index: true, sparse: true },
    displayName: { type: String, required: true, unique: true },
    avatarUrl: { type: String },
    passwordHash: { type: String, default: null },
    jwtVersion: { type: Number, default: 0 },
    refreshTokenId: { type: String, default: () => randomBytes(16).toString('hex') },
    highScore: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  inventory: [{ type: Schema.Types.ObjectId, ref: 'StoreItem' }],
  friends: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, since: { type: Date, default: Date.now } }],
    originalGuestId: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

// Expose the model
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
