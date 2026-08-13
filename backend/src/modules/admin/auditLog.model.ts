import mongoose, { Schema } from 'mongoose'

const auditLogSchema = new Schema(
  {
    actorUserId: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'audit_logs',
  }
)

export type AuditLogDocument = mongoose.Document & {
  actorUserId: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  timestamp: Date
  metadata: any
}

export const AuditLog = mongoose.models.AuditLog || mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema)
