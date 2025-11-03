import mongoose, { Schema, Document } from 'mongoose';

export interface IViolation extends Document {
  ruleId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  count: number;
  firstViolationAt: Date;
  lastViolationAt: Date;
  resolved?: boolean;
  details?: string;
}

const ViolationSchema = new Schema<IViolation>(
  {
    ruleId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Rule' },
    playerId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    count: { type: Number, default: 1 },
    firstViolationAt: { type: Date, default: Date.now },
    lastViolationAt: { type: Date, default: Date.now, index: true },
    resolved: { type: Boolean, default: false },
    details: { type: String },
  },
  { timestamps: false }
);

ViolationSchema.index({ playerId: 1, ruleId: 1 }, { unique: false });

export const ViolationModel = mongoose.models.Violation || mongoose.model<IViolation>('Violation', ViolationSchema);

export default ViolationModel;
