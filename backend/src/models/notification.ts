import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationTarget {
  type: 'all' | 'group' | 'user';
  group?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
}

export interface INotification extends Document {
  title: string;
  body?: string;
  level?: 'info' | 'promo' | 'critical';
  target: INotificationTarget;
  payload?: Record<string, unknown>;
  readBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    body: { type: String },
    level: { type: String, enum: ['info', 'promo', 'critical'], default: 'info' },
    target: {
      type: {
        type: String,
        enum: ['all', 'group', 'user'],
        required: true,
      },
      group: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
      user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Indexes to support typical queries: recent + per-target
NotificationSchema.index({ 'target.type': 1, createdAt: -1 });
NotificationSchema.index({ 'target.group': 1, createdAt: -1 });

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;
