import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { NotFoundError } from '../../core/errors.js'
import { Tenancy } from './tenancy.model.js'
import { Property } from '../property/models/property.model.js'

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
    advanceAmount: doc.advanceAmount,
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

  let query: Record<string, unknown> = {}

  if (!isSuperAdmin) {
    if (isOwner) {
      query = {
        $or: [{ ownerId: user?.id }, { ownerEmail: user?.email?.toLowerCase() }],
      }
    } else {
      query = {
        $or: [{ tenantEmail: user?.email?.toLowerCase() }],
      }
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
  const ownerEmail = req.body.ownerEmail || req.user?.email || ''
  const ownerId = req.body.ownerId || req.user?.id || ''

  const property = await Property.findById(req.body.propertyId).lean().catch(() => null)

  const doc = await Tenancy.create({
    tenantName: req.body.tenantName,
    tenantEmail: req.body.tenantEmail.toLowerCase(),
    tenantPhone: req.body.tenantPhone || '',
    propertyId: req.body.propertyId,
    propertyName: req.body.propertyName || (property ? property.name : 'Rented Property'),
    unitNumber: req.body.unitNumber || 'Main',
    unitsOccupied: req.body.unitsOccupied || 1,
    leaseStart: new Date(req.body.leaseStart),
    leaseEnd: new Date(req.body.leaseEnd),
    leaseDurationMonths: req.body.leaseDurationMonths || 12,
    monthlyRent: req.body.monthlyRent,
    advanceAmount: req.body.advanceAmount || req.body.monthlyRent * 2,
    securityDeposit: req.body.securityDeposit || req.body.monthlyRent * 5,
    leaseNotes: req.body.leaseNotes || '',
    ownerEmail: ownerEmail.toLowerCase(),
    ownerId,
    status: 'active',
  })

  // Increment occupied units
  if (req.body.propertyId) {
    await Property.findByIdAndUpdate(req.body.propertyId, { $inc: { occupiedUnits: 1 } }).catch(() => null)
  }

  res.status(201).json({ data: formatDoc(doc), meta: {}, error: null })
})

export const updateTenancy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const updated = await Tenancy.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true }).lean()
  if (!updated) throw new NotFoundError('Tenancy not found')
  res.json({ data: formatDoc(updated), meta: {}, error: null })
})

export const deleteTenancy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const deleted = await Tenancy.findByIdAndDelete(id).lean()
  if (!deleted) throw new NotFoundError('Tenancy not found')
  res.json({ data: formatDoc(deleted), meta: {}, error: null })
})
