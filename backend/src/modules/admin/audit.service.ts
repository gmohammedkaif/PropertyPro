import { AuditLog } from './auditLog.model.js'
import { logger } from '../../core/logger.js'

// In-memory fallback for dev/testing when MongoDB is bypassed
export const inMemoryAuditLogs: any[] = []

export interface AuditLogInput {
  actorUserId: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  metadata?: any
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  const logEntry = {
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    timestamp: new Date(),
    metadata: input.metadata || {},
  }

  // Always log using pino
  logger.info(logEntry, `Audit Event: ${input.action}`)

  // Store in-memory
  inMemoryAuditLogs.push({
    id: `audit_${Math.random().toString(36).substring(2, 9)}`,
    ...logEntry,
  })

  // Try saving to MongoDB if possible
  try {
    if (AuditLog.db.readyState === 1) {
      await AuditLog.create(logEntry)
    }
  } catch (err) {
    // Fail-safe to avoid disrupting main workflow
    logger.error(err, 'Failed to save audit log to MongoDB')
  }
}

export async function getAuditLogs(): Promise<any[]> {
  try {
    if (AuditLog.db.readyState === 1) {
      const logs = await AuditLog.find().sort({ createdAt: -1 }).lean()
      return logs.map((l: any) => ({
        id: l._id.toString(),
        actorUserId: l.actorUserId,
        actorRole: l.actorRole,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        timestamp: l.timestamp || l.createdAt,
        metadata: l.metadata || {},
      }))
    }
  } catch (err) {
    logger.error(err, 'Failed to fetch audit logs from MongoDB')
  }

  // Fallback to in-memory, sorted descending by timestamp
  return [...inMemoryAuditLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
