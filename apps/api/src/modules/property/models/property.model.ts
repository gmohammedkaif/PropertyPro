import mongoose, { Schema, model, type InferSchemaType } from 'mongoose'

const addressSchema = new Schema(
  {
    line1: { type: String, required: true },
    line2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
)

const locationSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
)

const propertySchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['apartment', 'house', 'commercial', 'mixed'], required: true },
    address: { type: addressSchema, required: true },
    location: { type: locationSchema, index: '2dsphere' },
    description: { type: String, default: null },
    amenities: { type: [String], default: [] },
    totalUnits: { type: Number, default: 0, min: 0 },
    occupiedUnits: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    images: { type: [String], default: [] },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'properties',
  },
)

propertySchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' })
propertySchema.index({ ownerId: 1, status: 1 })
propertySchema.index({ 'address.city': 1 })
propertySchema.index({ 'address.state': 1 })
propertySchema.index({ type: 1 })
propertySchema.index({ status: 1 })
propertySchema.index({ createdAt: -1 })

export type PropertyDocument = InferSchemaType<typeof propertySchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const Property =
  (mongoose.models.Property as import('mongoose').Model<PropertyDocument> | undefined) ??
  model<PropertyDocument>('Property', propertySchema)
