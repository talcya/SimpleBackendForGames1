import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IGuest extends Document {
  guestId: string;
  highScore: number;
  inventory: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastActive: Date;
  createdAt: Date;
}

const GuestSchema = new Schema<IGuest>(
  {
    guestId: { type: String, required: true, unique: true, default: () => uuidv4() },
    highScore: { type: Number, default: 0 },
    inventory: [{ type: Schema.Types.ObjectId, ref: 'Item' }],
    isActive: { type: Boolean, default: true },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

GuestSchema.pre('save', function (next) {
  this.lastActive = new Date();
  next();
});

GuestSchema.index({ guestId: 1 });
GuestSchema.index({ lastActive: 1 });

export const GuestModel = mongoose.models.Guest || mongoose.model<IGuest>('Guest', GuestSchema);

export default GuestModel;
