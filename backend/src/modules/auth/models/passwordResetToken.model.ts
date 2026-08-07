import mongoose from 'mongoose'
import { Schema, type InferSchemaType, type Model } from 'mongoose'

const passwordResetTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    // TTL index removes the document once `expiresAt` passes.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'password_reset_tokens',
  },
)

export type PasswordResetTokenDocument = InferSchemaType<typeof passwordResetTokenSchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const PasswordResetToken =
  (mongoose.models.PasswordResetToken as Model<PasswordResetTokenDocument> | undefined) ??
  mongoose.model<PasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema)
