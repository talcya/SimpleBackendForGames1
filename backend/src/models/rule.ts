import mongoose, { Schema, Document } from 'mongoose';

export interface IRule extends Document {
  name: string;
  description?: string;
  action: string; // e.g. 'flag', 'suppress', 'ban'
  threshold: number; // numeric threshold for the rule
  windowSeconds: number; // evaluation window in seconds
  severity?: 'low' | 'medium' | 'high';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema = new Schema<IRule>(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    action: { type: String, required: true, enum: ['flag', 'suppress', 'ban', 'notify'], default: 'flag' },
    threshold: { type: Number, required: true, default: 1 },
    windowSeconds: { type: Number, required: true, default: 60 },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const RuleModel = mongoose.models.Rule || mongoose.model<IRule>('Rule', RuleSchema);

export default RuleModel;
