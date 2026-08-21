import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { NotFoundError, ForbiddenError, ConflictError } from '../../core/errors.js'
import { Tenancy } from './tenancy.model.js'
import { Property } from '../property/models/property.model.js'
import { createNotificationIdempotent } from '../notification/notification.model.js'

import { syncPropertyOccupancy } from '../property/propertyOccupancy.service.js'

function formatDoc(doc: any) {
  return {
    id: doc._id.toString(),
    tenantName: doc.tenantName,
    tenantEmail: doc.tenantEmail,
    tenantPhone: doc.tenantPhone,
    propertyId: doc.propertyId,
    propertyName: doc.propertyName,
    unitNumber: doc.unitNumber,
    unitsOccupied: doc.unitsOccupied,
    leaseStart: doc.leaseStart ? doc.leaseStart.toISOString() : null,
    leaseEnd: doc.leaseEnd ? doc.leaseEnd.toISOString() : null,
    leaseDurationMonths: doc.leaseDurationMonths,
    monthlyRent: doc.monthlyRent,
    securityDeposit: doc.securityDeposit,
    leaseNotes: doc.leaseNotes,
    ownerEmail: doc.ownerEmail,
    ownerId: doc.ownerId,
    requestId: doc.requestId,
    status: doc.status,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  }
}

export const listTenancies = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user
  const isSuperAdmin = user?.roles.includes('admin') || user?.email === 'admin@propertypro.com'
  const isOwner = user?.roles.includes('owner') || user?.roles.includes('agent')

  let query: Record<string, any> = { status: { $ne: 'terminated' } }

  if (!isSuperAdmin) {
    if (isOwner) {
      query.$or = [{ ownerId: user?.id }, { ownerEmail: user?.email?.toLowerCase() }]
    } else {
      query.$or = [{ tenantEmail: user?.email?.toLowerCase() }]
    }
  }

  const items = await Tenancy.find(query).sort({ createdAt: -1 }).lean()
  res.json({ data: items.map(formatDoc), meta: { total: items.length }, error: null })
})

export const getMyLease = asyncHandler(async (req: Request, res: Response) => {
  const tenantEmail = req.user?.email?.toLowerCase()
  if (!tenantEmail) throw new NotFoundError('Tenant email not found in session')

  const tenancy = await Tenancy.findOne({
    tenantEmail,
    status: { $in: ['active', 'expiring-soon'] },
  }).sort({ createdAt: -1 }).lean()

  if (!tenancy) {
    res.json({ data: null, meta: {}, error: null })
    return
  }

  res.json({ data: formatDoc(tenancy), meta: {}, error: null })
})

export const getMyTenancy = asyncHandler(async (req: Request, res: Response) => {
  const tenantEmail = req.user?.email?.toLowerCase()
  if (!tenantEmail) throw new NotFoundError('Tenant email not found in session')

  const tenancy = await Tenancy.findOne({
    tenantEmail,
    status: { $in: ['active', 'expiring-soon'] },
  }).sort({ createdAt: -1 }).lean()

  res.json({ data: tenancy ? formatDoc(tenancy) : null, meta: {}, error: null })
})

export const createTenancy = asyncHandler(async (req: Request, res: Response) => {
  const ownerEmail = req.user?.email || ''
  const ownerId = req.user?.id || ''

  const property = await Property.findById(req.body.propertyId).lean().catch(() => null)
  if (!property) throw new NotFoundError('Property not found')

  if (property.ownerId !== ownerId && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to manage this property')
  }

  const targetUnitNumber = req.body.unitNumber || 'Main'
  const countToOccupy = Math.max(1, Number(req.body.unitsOccupied) || 1)

  // 1. Check in-memory unit availability first
  const activeTenancy = await Tenancy.findOne({
    propertyId: req.body.propertyId,
    unitNumber: targetUnitNumber,
    status: { $in: ['active', 'expiring-soon'] },
  }).lean()

  if (activeTenancy) {
    throw new ConflictError(`Unit "${targetUnitNumber}" already has an active tenancy lease`)
  }

  // 2. Atomically reserve property capacity using $expr check
  let updatedProp: any = null
  if (req.body.propertyId) {
    updatedProp = await Property.findOneAndUpdate(
      {
        _id: req.body.propertyId,
        $expr: { $lte: [{ $add: ['$occupiedUnits', countToOccupy] }, { $ifNull: ['$totalUnits', 1] }] },
      },
      { $inc: { occupiedUnits: countToOccupy } },
      { new: true },
    )

    if (!updatedProp) {
      throw new ConflictError('This property does not have enough available unit capacity')
    }
  }

  // 3. Create Tenancy document with E11000 duplicate index catch
  let doc: any = null
  try {
    doc = await Tenancy.create({
      tenantName: req.body.tenantName,
      tenantEmail: req.body.tenantEmail.toLowerCase(),
      tenantPhone: req.body.tenantPhone || '',
      propertyId: req.body.propertyId,
      propertyName: req.body.propertyName || property.name,
      unitNumber: targetUnitNumber,
      unitsOccupied: countToOccupy,
      leaseStart: new Date(req.body.leaseStart),
      leaseEnd: new Date(req.body.leaseEnd),
      leaseDurationMonths: req.body.leaseDurationMonths || 12,
      monthlyRent: req.body.monthlyRent,
      securityDeposit: req.body.securityDeposit || req.body.monthlyRent * 2,
      leaseNotes: req.body.leaseNotes || '',
      ownerEmail: ownerEmail.toLowerCase(),
      ownerId,
      status: 'active',
    })
    if (req.body.propertyId) {
      await syncPropertyOccupancy([req.body.propertyId])
    }
  } catch (createErr: any) {
    if (updatedProp && req.body.propertyId) {
      await Property.findByIdAndUpdate(req.body.propertyId, { $inc: { occupiedUnits: -countToOccupy } }).catch(() => null)
    }
    const isDuplicateKey =
      createErr?.code === 11000 ||
      createErr?.cause?.code === 11000 ||
      (typeof createErr?.message === 'string' && createErr.message.includes('E11000'))

    if (isDuplicateKey) {
      throw new ConflictError(`Unit "${targetUnitNumber}" already has an active tenancy lease`)
    }
    throw createErr
  }

  res.status(201).json({ data: formatDoc(doc), meta: {}, error: null })
})

export const updateTenancy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const tenancy = await Tenancy.findById(id)
  if (!tenancy) throw new NotFoundError('Tenancy not found')

  if (tenancy.ownerId !== req.user?.id && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to modify this tenancy')
  }

  const updated = await Tenancy.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true }).lean()
  res.json({ data: formatDoc(updated!), meta: {}, error: null })
})

export const deleteTenancy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const tenancy = await Tenancy.findById(id)
  if (!tenancy) throw new NotFoundError('Tenancy not found')

  if (tenancy.ownerId !== req.user?.id && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to delete this tenancy')
  }

  // Idempotent termination safeguard: only transition and decrement if lease was active
  if (tenancy.status === 'active' || tenancy.status === 'expiring-soon') {
    tenancy.status = 'terminated'
    await tenancy.save()

    // Synchronize real property occupancy from active tenancies
    if (tenancy.propertyId) {
      await syncPropertyOccupancy([tenancy.propertyId])
    }

    // Emit notifications
    const tenancyIdStr = tenancy._id.toString()
    if (tenancy.tenantEmail) {
      await createNotificationIdempotent({
        userEmail: tenancy.tenantEmail,
        title: 'Lease Terminated 🛑',
        message: `Your tenancy lease for ${tenancy.propertyName} has been terminated.`,
        type: 'warning',
        eventType: 'LEASE_TERMINATED',
        relatedEntityId: tenancyIdStr,
      })
    }
    if (tenancy.ownerEmail) {
      await createNotificationIdempotent({
        userEmail: tenancy.ownerEmail,
        title: 'Lease Terminated 🛑',
        message: `The tenancy lease for ${tenancy.propertyName} (${tenancy.tenantName}) has been terminated.`,
        type: 'info',
        eventType: 'LEASE_TERMINATED',
        relatedEntityId: tenancyIdStr,
      })
    }
  }

  res.json({ data: formatDoc(tenancy), meta: {}, error: null })
})
