import mongoose, { Schema, Document } from 'mongoose';

export interface IRule extends Document {
  name: string;
  description?: string;
  gameId: string;
  action: string; // the key measured in payload like 'speed'
  threshold?: number;
  windowSeconds?: number;
  normals?: Record<string, unknown>;
  violationOptions?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema = new Schema<IRule>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    gameId: { type: String, required: false, index: true, default: 'default' },
    action: { type: String, required: true },
    // legacy numeric threshold/window behavior (kept for compatibility)
    threshold: { type: Number, required: true, default: 1 },
    windowSeconds: { type: Number, required: true, default: 60 },
    normals: { type: Schema.Types.Mixed, default: {} },
    violationOptions: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Unique per game + name so you can reuse rule names across games
RuleSchema.index({ gameId: 1, name: 1 }, { unique: true });

export const RuleModel = mongoose.models.Rule || mongoose.model<IRule>('Rule', RuleSchema);

export default RuleModel;
