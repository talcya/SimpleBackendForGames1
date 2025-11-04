import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
  player: mongoose.Types.ObjectId;
  joinAt?: Date;
  leaveAt?: Date | null;
  finalScore?: number;
  stats?: Record<string, unknown>;
  place?: number;
  rewardsGiven?: mongoose.Types.ObjectId[];
}

export interface IMatch extends Document {
  gameId: string;
  matchType: string;
  sessionRef?: mongoose.Types.ObjectId | null;
  tournament?: mongoose.Types.ObjectId | null;
  specialEvent?: mongoose.Types.ObjectId | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  participants: IParticipant[];
  matchMeta?: Record<string, unknown>;
  scoreSummary?: Record<string, unknown>;
  status: 'pending' | 'active' | 'finished' | 'cancelled';
  processed: boolean;
  createdBy?: mongoose.Types.ObjectId | null;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    joinAt: { type: Date, default: Date.now },
    leaveAt: { type: Date, default: null },
    finalScore: { type: Number, default: 0 },
    stats: { type: Schema.Types.Mixed, default: {} },
    place: { type: Number, default: null },
    rewardsGiven: [{ type: Schema.Types.ObjectId, ref: 'StoreItem' }],
  },
  { _id: false }
);

const MatchSchema = new Schema<IMatch>(
  {
    gameId: { type: String, default: 'default', index: true },
    matchType: { type: String, default: 'casual' },
    sessionRef: { type: Schema.Types.ObjectId, ref: 'GameSession', default: null },
    tournament: { type: Schema.Types.ObjectId, ref: 'Tournament', default: null },
    specialEvent: { type: Schema.Types.ObjectId, ref: 'SpecialEvent', default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    participants: { type: [ParticipantSchema], default: [] },
    matchMeta: { type: Schema.Types.Mixed, default: {} },
    scoreSummary: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'active', 'finished', 'cancelled'], default: 'pending' },
    processed: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

MatchSchema.index({ status: 1, createdAt: -1 });
MatchSchema.index({ tournament: 1 });

export const MatchModel = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export default MatchModel;
