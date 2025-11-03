import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerScore extends Document {
  player: mongoose.Types.ObjectId;
  gameId: string;
  score: number;
  scope: 'local' | 'global' | 'friends';
  localId?: mongoose.Types.ObjectId | null;
  updatedAt: Date;
}

const PlayerScoreSchema = new Schema<IPlayerScore>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gameId: { type: String, default: 'default', index: true },
    score: { type: Number, default: 0, index: true },
    scope: { type: String, enum: ['local', 'global', 'friends'], default: 'global' },
    localId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique constraint per player/game/scope/local
PlayerScoreSchema.index({ player: 1, gameId: 1, scope: 1, localId: 1 }, { unique: true });

// For fast leaderboard queries
PlayerScoreSchema.index({ gameId: 1, scope: 1, score: -1 });

export const PlayerScoreModel = mongoose.models.PlayerScore || mongoose.model<IPlayerScore>('PlayerScore', PlayerScoreSchema);

export default PlayerScoreModel;
