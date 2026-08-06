import mongoose from 'mongoose'
import { Schema, type InferSchemaType, type Model } from 'mongoose'

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    familyId: { type: String, required: true, index: true },
    // TTL index removes the document once `expiresAt` passes.
    expiresAt: { type: Date, required: true, expires: 0 },
    revokedAt: { type: Date, default: null },
    replacedByTokenId: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'refresh_tokens',
  },
)

export type RefreshTokenDocument = InferSchemaType<typeof refreshTokenSchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const RefreshToken =
  (mongoose.models.RefreshToken as Model<RefreshTokenDocument> | undefined) ??
  mongoose.model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema)
