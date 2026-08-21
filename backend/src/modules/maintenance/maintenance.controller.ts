import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { NotFoundError, ForbiddenError } from '../../core/errors.js'
import { Maintenance } from './maintenance.model.js'
import { Tenancy } from '../tenancy/tenancy.model.js'
import { Notification } from '../notification/notification.model.js'
import {
  maintenanceIdSchema,
  createMaintenanceSchema,
  updateMaintenanceTenantSchema,
  updateMaintenanceOwnerSchema,
  PROTECTED_MAINTENANCE_FIELDS,
} from './maintenance.schemas.js'

function formatDoc(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    propertyName: doc.propertyName,
    propertyId: doc.propertyId,
    category: doc.category,
    priority: doc.priority,
    status: doc.status,
    reportedBy: doc.reportedBy,
    tenantEmail: doc.tenantEmail,
    tenantId: doc.tenantId,
    ownerEmail: doc.ownerEmail,
    ownerId: doc.ownerId,
    assignedTo: doc.assignedTo,
    resolvedAt: doc.resolvedAt ? doc.resolvedAt.toISOString() : null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  }
}

export const createMaintenanceTicket = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user
  const userEmail = user?.email?.toLowerCase() || ''
  const userId = user?.id || ''
  const isOwnerOrAdmin = user?.roles.includes('owner') || user?.roles.includes('agent') || user?.roles.includes('admin')

  const input = createMaintenanceSchema.parse(req.body)

  let tenancy: any = null
  if (!isOwnerOrAdmin) {
    tenancy = await Tenancy.findOne({
      tenantEmail: userEmail,
      status: { $in: ['active', 'expiring-soon'] },
    }).lean()

    if (!tenancy) {
      throw new ForbiddenError('You must have an active lease/tenancy to submit a maintenance ticket')
    }
  }

  const tenantEmail = isOwnerOrAdmin ? (req.body.tenantEmail?.toLowerCase() || userEmail) : userEmail
  const tenantId = isOwnerOrAdmin ? (req.body.tenantId || userId) : userId
  const ownerEmail = tenancy?.ownerEmail || (isOwnerOrAdmin ? userEmail : '')
  const ownerId = tenancy?.ownerId || (isOwnerOrAdmin ? userId : '')
  const propertyId = tenancy?.propertyId || req.body.propertyId || ''
  const propertyName = tenancy?.propertyName || req.body.propertyName || 'Property'

  const doc: any = await Maintenance.create({
    title: input.title,
    description: input.description || '',
    propertyName,
    propertyId,
    category: input.category || 'Electrical',
    priority: (input.priority || 'medium').toLowerCase() as any,
    status: 'open',
    reportedBy: input.reportedBy || user?.name || 'Tenant',
    tenantEmail,
    tenantId,
    ownerEmail,
    ownerId,
  })

  // Notify Owner
  if (ownerEmail) {
    await Notification.create({
      userEmail: ownerEmail.toLowerCase(),
      userId: ownerId,
      title: 'New Maintenance Request 🛠️',
      message: `${doc.reportedBy} reported "${doc.title}" for ${doc.propertyName}. Priority: ${String(doc.priority).toUpperCase()}.`,
      type: 'warning',
    })
  }

  // Notify Tenant
  if (tenantEmail) {
    await Notification.create({
      userEmail: tenantEmail.toLowerCase(),
      userId: tenantId,
      title: 'Maintenance Request Submitted 🛠️',
      message: `Your issue "${doc.title}" has been logged and assigned to your property manager.`,
      type: 'info',
    })
  }

  res.status(201).json({ data: formatDoc(doc), meta: {}, error: null })
})

export const listMaintenanceTickets = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user
  const isSuperAdmin = user?.roles.includes('admin') || user?.email === 'admin@propertypro.com'
  const isOwner = user?.roles.includes('owner') || user?.roles.includes('agent')

  let query: Record<string, unknown> = {}

  if (!isSuperAdmin) {
    if (isOwner) {
      query = {
        $or: [{ ownerId: user?.id }, { ownerEmail: user?.email?.toLowerCase() }],
      }
    } else {
      query = {
        $or: [{ tenantEmail: user?.email?.toLowerCase() }, { reportedBy: user?.name }],
      }
    }
  }

  const items = await Maintenance.find(query).sort({ createdAt: -1 }).lean()
  res.json({ data: items.map(formatDoc), meta: { total: items.length }, error: null })
})

export const updateMaintenanceTicket = asyncHandler(async (req: Request, res: Response) => {
  const { id } = maintenanceIdSchema.parse(req.params)
  const existing = await Maintenance.findById(id)
  if (!existing) throw new NotFoundError('Maintenance ticket not found')

  const user = req.user
  const userEmail = user?.email?.toLowerCase() ?? ''
  const userId = user?.id ?? ''
  const userName = user?.name?.toLowerCase() ?? ''

  const isAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'
  const isOwner =
    (existing.ownerId && existing.ownerId === userId) ||
    (existing.ownerEmail && existing.ownerEmail.toLowerCase() === userEmail)
  const isTenant =
    (existing.tenantId && existing.tenantId === userId) ||
    (existing.tenantEmail && existing.tenantEmail.toLowerCase() === userEmail) ||
    (existing.reportedBy && existing.reportedBy.toLowerCase() === userName)

  if (!isOwner && !isTenant && !isAdmin) {
    throw new ForbiddenError('You do not have permission to modify this maintenance ticket')
  }

  // Reject any attempt to modify protected identity/ownership fields
  const bodyKeys = Object.keys(req.body || {})
  const hasProtectedField = bodyKeys.some((key) => PROTECTED_MAINTENANCE_FIELDS.includes(key))
  if (hasProtectedField) {
    throw new ForbiddenError('Modifying protected ticket ownership/identity fields is not allowed')
  }

  // Validate allowed update payload by role using strict Zod schemas
  let updatePayload: Record<string, any> = {}

  if (isTenant && !isOwner && !isAdmin) {
    // Tenant role: allowed fields (title, description, category, priority)
    // Tenants cannot modify status, assignedTo, or protected fields
    if (req.body.status !== undefined) {
      throw new ForbiddenError('Tenants are not authorized to change ticket status directly')
    }
    updatePayload = updateMaintenanceTenantSchema.parse(req.body)
  } else {
    // Owner / Admin role: allowed fields (title, description, propertyName, category, priority, status, assignedTo, resolvedAt)
    updatePayload = updateMaintenanceOwnerSchema.parse(req.body)
  }

  const oldStatus = existing.status
  const updated = await Maintenance.findByIdAndUpdate(
    id,
    { $set: updatePayload },
    { new: true, runValidators: true }
  ).lean()

  if (!updated) throw new NotFoundError('Maintenance ticket not found')

  // Send status update notification to tenant if status changed
  if (updatePayload.status && updatePayload.status !== oldStatus && updated.tenantEmail) {
    await Notification.create({
      userEmail: updated.tenantEmail.toLowerCase(),
      userId: updated.tenantId,
      title: 'Maintenance Status Update 🛠️',
      message: `Your maintenance ticket "${updated.title}" status changed to ${updated.status.toUpperCase()}.`,
      type: updated.status === 'resolved' || updated.status === 'closed' ? 'success' : 'info',
    })
  }

  res.json({ data: formatDoc(updated), meta: {}, error: null })
})

export const deleteMaintenanceTicket = asyncHandler(async (req: Request, res: Response) => {
  const { id } = maintenanceIdSchema.parse(req.params)
  const existing = await Maintenance.findById(id)
  if (!existing) throw new NotFoundError('Maintenance ticket not found')

  const user = req.user
  const userEmail = user?.email?.toLowerCase() ?? ''
  const userId = user?.id ?? ''
  const userName = user?.name?.toLowerCase() ?? ''

  const isAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'
  const isOwner =
    (existing.ownerId && existing.ownerId === userId) ||
    (existing.ownerEmail && existing.ownerEmail.toLowerCase() === userEmail)
  const isTenant =
    (existing.tenantId && existing.tenantId === userId) ||
    (existing.tenantEmail && existing.tenantEmail.toLowerCase() === userEmail) ||
    (existing.reportedBy && existing.reportedBy.toLowerCase() === userName)

  if (!isOwner && !isTenant && !isAdmin) {
    throw new ForbiddenError('You do not have permission to delete this maintenance ticket')
  }

  if (isAdmin) {
    const deleted = await Maintenance.findByIdAndDelete(id).lean()
    res.json({ data: formatDoc(deleted!), meta: {}, error: null })
  } else {
    // Tenants and Owners cannot permanently hard delete tickets; instead transition status to 'closed'
    existing.status = 'closed'
    await existing.save()
    res.json({ data: formatDoc(existing), meta: {}, error: null })
  }
})
