import mongoose, { Schema, model, type InferSchemaType } from 'mongoose'

const tenancySchema = new Schema(
  {
    tenantName: { type: String, required: true, trim: true },
    tenantEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    tenantPhone: { type: String, default: '' },
    propertyId: { type: String, required: true, index: true },
    propertyName: { type: String, required: true, trim: true },
    unitNumber: { type: String, default: 'Main' },
    unitsOccupied: { type: Number, default: 1 },
    leaseStart: { type: Date, required: true },
    leaseEnd: { type: Date, required: true },
    leaseDurationMonths: { type: Number, default: 12 },
    monthlyRent: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0 },
    leaseNotes: { type: String, default: '' },
    ownerEmail: { type: String, default: '', index: true },
    ownerId: { type: String, default: '', index: true },
    requestId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'expiring-soon', 'expired', 'terminated'],
      default: 'active',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'tenancies',
  },
)

tenancySchema.index({ tenantEmail: 1, status: 1 })
tenancySchema.index({ ownerEmail: 1, status: 1 })
tenancySchema.index(
  { propertyId: 1, unitNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['active', 'expiring-soon'] } },
  },
)

export type TenancyDocument = InferSchemaType<typeof tenancySchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const Tenancy =
  (mongoose.models.Tenancy as import('mongoose').Model<TenancyDocument> | undefined) ??
  model<TenancyDocument>('Tenancy', tenancySchema)
