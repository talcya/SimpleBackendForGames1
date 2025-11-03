import mongoose, { Schema, Document } from 'mongoose';

export interface IEventLog extends Document {
  playerId?: mongoose.Types.ObjectId;
  eventType: string;
  payload: Record<string, unknown> | null;
  evaluated: boolean;
  matchedRuleIds: mongoose.Types.ObjectId[];
  evaluationResult?: Record<string, unknown> | null;
  createdAt: Date;
}

const EventLogSchema = new Schema<IEventLog>(
  {
    playerId: { type: Schema.Types.ObjectId, index: true, ref: 'User' },
    eventType: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: null },
    evaluated: { type: Boolean, default: false, index: true },
    matchedRuleIds: [{ type: Schema.Types.ObjectId, ref: 'Rule' }],
    evaluationResult: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EventLogSchema.index({ playerId: 1, createdAt: -1 });

export const EventLogModel = mongoose.models.EventLog || mongoose.model<IEventLog>('EventLog', EventLogSchema);

export default EventLogModel;
