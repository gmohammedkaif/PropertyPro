import mongoose, { Schema, model, type InferSchemaType } from 'mongoose'

const paymentSchema = new Schema(
  {
    tenantName: { type: String, required: true, trim: true },
    tenantEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    propertyId: { type: String, default: '', index: true },
    propertyName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date, default: null },
    ownerId: { type: String, default: '', index: true },
    ownerEmail: { type: String, default: '', lowercase: true, trim: true, index: true },
    tenancyId: { type: String, default: '', index: true },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue', 'partial'],
      default: 'pending',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['rent', 'deposit', 'maintenance', 'other'],
      default: 'rent',
      required: true,
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'payments',
  },
)

paymentSchema.index({ tenantEmail: 1, status: 1 })
paymentSchema.index({ status: 1, dueDate: 1 })

export type PaymentDocument = InferSchemaType<typeof paymentSchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const Payment =
  (mongoose.models.Payment as import('mongoose').Model<PaymentDocument> | undefined) ??
  model<PaymentDocument>('Payment', paymentSchema)
