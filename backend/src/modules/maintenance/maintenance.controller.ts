import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { NotFoundError, ForbiddenError } from '../../core/errors.js'
import { Maintenance } from './maintenance.model.js'
import { Tenancy } from '../tenancy/tenancy.model.js'
import { Notification } from '../notification/notification.model.js'

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
  const tenantEmail = req.user?.email?.toLowerCase() || ''
  const tenantId = req.user?.id || ''

  // Look up tenancy to find owner, enforcing they can only submit tickets for their active rental property
  const tenancy = await Tenancy.findOne({
    tenantEmail,
    status: { $in: ['active', 'expiring-soon'] },
  }).lean()

  if (!tenancy) {
    throw new ForbiddenError('You must have an active lease/tenancy to submit a maintenance ticket')
  }

  const ownerEmail = tenancy.ownerEmail || ''
  const ownerId = tenancy.ownerId || ''
  const propertyId = tenancy.propertyId || ''

  const doc = await Maintenance.create({
    title: req.body.title,
    description: req.body.description || '',
    propertyName: tenancy.propertyName,
    propertyId,
    category: req.body.category || 'Electrical',
    priority: (req.body.priority || 'medium').toLowerCase(),
    status: 'open',
    reportedBy: req.body.reportedBy || req.user?.name || 'Tenant',
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
      message: `${doc.reportedBy} reported "${doc.title}" for ${doc.propertyName}. Priority: ${doc.priority.toUpperCase()}.`,
      type: 'warning',
    })
  }

  // Notify Tenant
  await Notification.create({
    userEmail: tenantEmail.toLowerCase(),
    userId: tenantId,
    title: 'Maintenance Request Submitted 🛠️',
    message: `Your issue "${doc.title}" has been logged and assigned to your property manager.`,
    type: 'info',
  })

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
  const { id } = req.params
  const existing = await Maintenance.findById(id)
  if (!existing) throw new NotFoundError('Maintenance ticket not found')

  const isOwner = existing.ownerId === req.user?.id || existing.ownerEmail?.toLowerCase() === req.user?.email?.toLowerCase()
  const isTenant = existing.tenantId === req.user?.id || existing.tenantEmail?.toLowerCase() === req.user?.email?.toLowerCase()
  const isAdmin = req.user?.roles.includes('admin')

  if (!isOwner && !isTenant && !isAdmin) {
    throw new ForbiddenError('You do not have permission to modify this maintenance ticket')
  }

  const oldStatus = existing.status
  const updated = await Maintenance.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true }).lean()
  if (!updated) throw new NotFoundError('Maintenance ticket not found')

  // Send status update notification to tenant if status changed
  if (req.body.status && req.body.status !== oldStatus && updated.tenantEmail) {
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
  const { id } = req.params
  const existing = await Maintenance.findById(id)
  if (!existing) throw new NotFoundError('Maintenance ticket not found')

  const isOwner = existing.ownerId === req.user?.id || existing.ownerEmail?.toLowerCase() === req.user?.email?.toLowerCase()
  const isTenant = existing.tenantId === req.user?.id || existing.tenantEmail?.toLowerCase() === req.user?.email?.toLowerCase()
  const isAdmin = req.user?.roles.includes('admin')

  if (!isOwner && !isTenant && !isAdmin) {
    throw new ForbiddenError('You do not have permission to delete this maintenance ticket')
  }

  if (isAdmin) {
    const deleted = await Maintenance.findByIdAndDelete(id).lean()
    res.json({ data: formatDoc(deleted!), meta: {}, error: null })
  } else {
    // Tenants and Owners cannot permanently delete tickets; instead transition status to 'closed'
    existing.status = 'closed'
    await existing.save()
    res.json({ data: formatDoc(existing), meta: {}, error: null })
  }
})
