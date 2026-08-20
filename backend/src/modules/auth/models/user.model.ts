import { ROLE_LIST, type Role, type UserStatus } from '../../../shared/index.js'
import mongoose from 'mongoose'
import { Schema, type InferSchemaType, type Model } from 'mongoose'

const familyMemberSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true },
    age: { type: Number, default: 0 },
    phone: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false },
)

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], enum: ROLE_LIST, default: ['buyer'], required: true },
    profile: {
      firstName: { type: String, trim: true, default: '' },
      lastName: { type: String, trim: true, default: '' },
    },
    phone: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    familyMembers: { type: [familyMemberSchema], default: [] },
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
