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
    eventKey: { type: String, default: null, index: true },
    eventType: { type: String, default: '' },
    relatedEntityId: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'notifications',
  },
)

notificationSchema.index({ eventKey: 1 }, { unique: true, sparse: true })

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const Notification =
  (mongoose.models.Notification as import('mongoose').Model<NotificationDocument> | undefined) ??
  model<NotificationDocument>('Notification', notificationSchema)

export async function createNotificationIdempotent(input: {
  userEmail: string
  userId?: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'danger'
  eventKey?: string
  eventType?: string
  relatedEntityId?: string
}) {
  const userEmail = input.userEmail.toLowerCase().trim()
  const eventKey =
    input.eventKey ||
    (input.eventType && input.relatedEntityId ? `${input.eventType}:${input.relatedEntityId}:${userEmail}` : null)

  if (eventKey) {
    const existing = await Notification.findOne({ eventKey }).lean().catch(() => null)
    if (existing) {
      return existing
    }
  }

  try {
    return await Notification.create({
      userEmail,
      userId: input.userId || '',
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      eventKey,
      eventType: input.eventType || '',
      relatedEntityId: input.relatedEntityId || '',
    })
  } catch (err: any) {
    if (err.code === 11000 && eventKey) {
      const existing = await Notification.findOne({ eventKey }).lean().catch(() => null)
      if (existing) {
        return existing
      }
    }
    throw err
  }
}
