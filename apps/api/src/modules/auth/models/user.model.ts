import { ROLE_LIST, type Role, type UserStatus } from '@propertypro/shared'
import mongoose from 'mongoose'
import { Schema, type InferSchemaType, type Model } from 'mongoose'

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], enum: ROLE_LIST, default: ['buyer'], required: true },
    profile: {
      firstName: { type: String, trim: true, default: '' },
      lastName: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: ['pending_verification', 'pending_approval', 'active', 'suspended', 'rejected'],
      default: 'active',
      required: true,
    },
    emailVerifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'users',
  },
)

userSchema.index({ email: 1 }, { unique: true })

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const User =
  (mongoose.models.User as Model<UserDocument> | undefined) ?? mongoose.model<UserDocument>('User', userSchema)

export type { Role, UserStatus }
