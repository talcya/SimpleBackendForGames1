import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreItem extends Document {
  name: string;
  category?: string;
  price: number;
  currency?: string;
  howGotIt?: 'won' | 'purchased' | 'promo' | 'giveaway';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const StoreItemSchema = new Schema<IStoreItem>(
  {
    name: { type: String, required: true },
    category: { type: String, index: true, default: 'misc' },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'COINS' },
    howGotIt: { type: String, enum: ['won', 'purchased', 'promo', 'giveaway'], default: 'purchased' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

StoreItemSchema.index({ category: 1 });

export const StoreItemModel = mongoose.models.StoreItem || mongoose.model<IStoreItem>('StoreItem', StoreItemSchema);

export default StoreItemModel;
