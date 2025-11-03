import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  type: 'offer' | 'discount' | 'giveaway';
  name: string;
  description?: string;
  items: mongoose.Types.ObjectId[];
  discountPercent?: number;
  code?: string;
  startDate?: Date;
  endDate?: Date;
  maxUses?: number;
  usedBy: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    type: { type: String, required: true, enum: ['offer', 'discount', 'giveaway'] },
    name: { type: String, required: true },
    description: { type: String },
    items: [{ type: Schema.Types.ObjectId, ref: 'Item' }],
    discountPercent: { type: Number },
    code: { type: String, index: true, unique: true, sparse: true },
    startDate: { type: Date },
    endDate: { type: Date },
    maxUses: { type: Number, default: 1 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

OfferSchema.index({ code: 1, endDate: 1 });

export const OfferModel = mongoose.models.Offer || mongoose.model<IOffer>('Offer', OfferSchema);

export default OfferModel;
