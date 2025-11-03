import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerActivityGuard extends Document {
  player: mongoose.Types.ObjectId;
  lastActivityAt?: Date | null;
}

const PlayerActivityGuardSchema = new Schema<IPlayerActivityGuard>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    lastActivityAt: { type: Date, default: null },
  },
  { timestamps: false }
);

PlayerActivityGuardSchema.index({ player: 1 }, { unique: true });

export const PlayerActivityGuardModel =
  mongoose.models.PlayerActivityGuard || mongoose.model<IPlayerActivityGuard>('PlayerActivityGuard', PlayerActivityGuardSchema);

export default PlayerActivityGuardModel;
