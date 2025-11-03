import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  members: mongoose.Types.ObjectId[];
  purpose?: string;
  isActive: boolean;
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    purpose: { type: String, default: 'internal' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GroupModel = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);

export default GroupModel;
