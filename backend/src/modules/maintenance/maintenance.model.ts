import mongoose, { Schema, model, type InferSchemaType } from 'mongoose'

const maintenanceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    propertyName: { type: String, required: true, trim: true },
    propertyId: { type: String, default: '', index: true },
    category: { type: String, default: 'Electrical' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
      default: 'medium',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in-progress', 'resolved', 'closed', 'rejected'],
      default: 'open',
      required: true,
      index: true,
    },
    reportedBy: { type: String, required: true, trim: true },
    tenantEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    tenantId: { type: String, default: '', index: true },
    ownerEmail: { type: String, default: '', index: true },
    ownerId: { type: String, default: '', index: true },
    assignedTo: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'maintenance',
  },
)

maintenanceSchema.index({ tenantEmail: 1, status: 1 })
maintenanceSchema.index({ ownerEmail: 1, status: 1 })

export type MaintenanceDocument = InferSchemaType<typeof maintenanceSchema> & {
  _id: import('mongoose').Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const Maintenance =
  (mongoose.models.Maintenance as import('mongoose').Model<MaintenanceDocument> | undefined) ??
  model<MaintenanceDocument>('Maintenance', maintenanceSchema)
