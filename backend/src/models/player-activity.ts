import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerActivity extends Document {
  player: mongoose.Types.ObjectId;
  eventRef?: mongoose.Types.ObjectId;
  type: 'alert' | 'info' | 'violation' | 'high_score';
  details?: Record<string, unknown>;
  createdAt: Date;
}

const PlayerActivitySchema = new Schema<IPlayerActivity>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventRef: { type: Schema.Types.ObjectId, ref: 'GameEvent', default: null },
    type: { type: String, required: true, enum: ['alert', 'info', 'violation', 'high_score'] },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PlayerActivitySchema.index({ player: 1, createdAt: -1 });

export const PlayerActivityModel = mongoose.models.PlayerActivity || mongoose.model<IPlayerActivity>('PlayerActivity', PlayerActivitySchema);

export default PlayerActivityModel;
