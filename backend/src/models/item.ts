import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  category: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    category: { type: String, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ItemSchema.index({ category: 1, isActive: 1 });

export const ItemModel = mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);

export default ItemModel;
