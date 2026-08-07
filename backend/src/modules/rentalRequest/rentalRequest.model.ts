import mongoose, { Schema, model, type InferSchemaType } from 'mongoose'

const rentalRequestSchema = new Schema(
  {
    propertyId: { type: String, required: true, index: true },
    propertyName: { type: String, required: true, trim: true },
    propertyType: { type: String, default: 'apartment' },
    ownerId: { type: String, default: '', index: true },
    ownerEmail: { type: String, default: '', index: true },
    tenantId: { type: String, required: true, index: true },
    tenantEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    monthlyRent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'rental_requests',
  },
)

rentalRequestSchema.index({ tenantEmail: 1, status: 1 })
rentalRequestSchema.index({ ownerEmail: 1, status: 1 })

export type RentalRequestDocument = InferSchemaType<typeof rentalRequestSchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const RentalRequest =
  (mongoose.models.RentalRequest as import('mongoose').Model<RentalRequestDocument> | undefined) ??
  model<RentalRequestDocument>('RentalRequest', rentalRequestSchema)
