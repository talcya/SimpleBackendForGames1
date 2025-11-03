import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardEntry extends Document {
  leaderboardId: string;
  playerId: mongoose.Types.ObjectId;
  score: number;
  submittedAt: Date;
  type?: string;
  region?: string;
}

const LeaderboardSchema = new Schema<ILeaderboardEntry>(
  {
    leaderboardId: { type: String, required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    score: { type: Number, required: true, default: 0 },
    submittedAt: { type: Date, default: Date.now, index: true },
    type: { type: String, enum: ['global', 'local', 'friends'], default: 'global' },
    region: { type: String },
  },
  { timestamps: false }
);

LeaderboardSchema.index({ leaderboardId: 1, score: -1 });

export const LeaderboardModel =
  mongoose.models.Leaderboard || mongoose.model<ILeaderboardEntry>('Leaderboard', LeaderboardSchema);

export default LeaderboardModel;
