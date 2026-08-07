import mongoose, { Schema, model, type InferSchemaType } from 'mongoose'

const notificationSchema = new Schema(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    userId: { type: String, default: '', index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'danger'],
      default: 'info',
      required: true,
    },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'notifications',
  },
)

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const Notification =
  (mongoose.models.Notification as import('mongoose').Model<NotificationDocument> | undefined) ??
  model<NotificationDocument>('Notification', notificationSchema)
