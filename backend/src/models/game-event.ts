import mongoose, { Schema, Document } from 'mongoose';

export interface IGameEvent extends Document {
  type: string;
  source?: string;
  player?: mongoose.Types.ObjectId;
  gameId?: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  processed: boolean;
  processedAt?: Date | null;
}

const GameEventSchema = new Schema<IGameEvent>(
  {
    type: { type: String, required: true, index: true },
    source: { type: String },
    player: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    gameId: { type: String, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false, index: true },
    processedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GameEventSchema.index({ createdAt: -1 });

export const GameEventModel = mongoose.models.GameEvent || mongoose.model<IGameEvent>('GameEvent', GameEventSchema);

export default GameEventModel;
