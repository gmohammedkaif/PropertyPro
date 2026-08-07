import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { NotFoundError } from '../../core/errors.js'
import { RentalRequest } from './rentalRequest.model.js'
import { Tenancy } from '../tenancy/tenancy.model.js'
import { Payment } from '../payment/payment.model.js'
import { Notification } from '../notification/notification.model.js'
import { Property } from '../property/models/property.model.js'

function formatDoc(doc: any) {
  return {
    id: doc._id.toString(),
    propertyId: doc.propertyId,
    propertyName: doc.propertyName,
    propertyType: doc.propertyType,
    ownerId: doc.ownerId,
    ownerEmail: doc.ownerEmail,
    tenantId: doc.tenantId,
    tenantEmail: doc.tenantEmail,
    fullName: doc.fullName,
    mobileNumber: doc.mobileNumber,
    city: doc.city,
    monthlyRent: doc.monthlyRent,
    status: doc.status,
    notes: doc.notes,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  }
}

export const createRentalRequest = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.id
  const tenantEmail = req.body.tenantEmail || req.user?.email || 'tenant@propertypro.app'

  const property = await Property.findById(req.body.propertyId).lean().catch(() => null)
  const ownerEmail = req.body.ownerEmail || (property ? (property as any).ownerEmail : '') || 'owner@propertypro.com'
  const ownerId = req.body.ownerId || (property ? (property as any).ownerId : '') || ''

  const doc = await RentalRequest.create({
    propertyId: req.body.propertyId,
    propertyName: req.body.propertyName || (property ? property.name : 'Rented Property'),
    propertyType: req.body.propertyType || (property ? property.type : 'apartment'),
    ownerId,
    ownerEmail,
    tenantId: tenantId || `usr_${Date.now()}`,
    tenantEmail,
    fullName: req.body.fullName,
    mobileNumber: req.body.mobileNumber,
    city: req.body.city,
    monthlyRent: req.body.monthlyRent || (property ? (property as any).monthlyRent : 0) || 0,
    status: 'pending',
    notes: req.body.notes || '',
  })

  // Notify Owner
  if (ownerEmail) {
    await Notification.create({
      userEmail: ownerEmail.toLowerCase(),
      userId: ownerId,
      title: 'New Rental Request Received 📩',
      message: `${req.body.fullName} submitted a rental request for ${doc.propertyName}.`,
      type: 'info',
    })
  }

  // Notify Tenant
  await Notification.create({
    userEmail: tenantEmail.toLowerCase(),
    userId: tenantId || '',
    title: 'Rental Request Sent 🚀',
    message: `Your rental request for ${doc.propertyName} has been sent to the property owner.`,
    type: 'warning',
  })

  res.status(201).json({ data: formatDoc(doc), meta: {}, error: null })
})

export const listRentalRequests = asyncHandler(async (req: Request, res: Response) => {
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
        $or: [{ tenantId: user?.id }, { tenantEmail: user?.email?.toLowerCase() }],
      }
    }
  }

  const items = await RentalRequest.find(query).sort({ createdAt: -1 }).lean()
  res.json({ data: items.map(formatDoc), meta: { total: items.length }, error: null })
})

export const approveRentalRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const requestDoc = await RentalRequest.findById(id)
  if (!requestDoc) throw new NotFoundError('Rental request not found')

  requestDoc.status = 'approved'
  await requestDoc.save()

  // Calculate 1 year lease dates
  const startDate = new Date()
  const endDate = new Date()
  endDate.setFullYear(endDate.getFullYear() + 1)

  // 1. Create Tenancy (Lease Document) in MongoDB
  const tenancyDoc = await Tenancy.create({
    tenantName: requestDoc.fullName,
    tenantEmail: requestDoc.tenantEmail.toLowerCase(),
    tenantPhone: requestDoc.mobileNumber,
    propertyId: requestDoc.propertyId,
    propertyName: requestDoc.propertyName,
    unitNumber: req.body.unitNumber || 'Main',
    unitsOccupied: 1,
    leaseStart: startDate,
    leaseEnd: endDate,
    leaseDurationMonths: 12,
    monthlyRent: requestDoc.monthlyRent || 10000,
    advanceAmount: (requestDoc.monthlyRent || 10000) * 2,
    securityDeposit: (requestDoc.monthlyRent || 10000) * 5,
    leaseNotes: req.body.leaseNotes || 'Standard 12-month residential lease agreement.',
    ownerEmail: requestDoc.ownerEmail.toLowerCase(),
    ownerId: requestDoc.ownerId,
    requestId: requestDoc._id.toString(),
    status: 'active',
  })

  // 2. Create Initial Rent Payment Invoice in MongoDB
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 5)
  await Payment.create({
    tenantName: requestDoc.fullName,
    tenantEmail: requestDoc.tenantEmail.toLowerCase(),
    propertyId: requestDoc.propertyId,
    propertyName: requestDoc.propertyName,
    amount: requestDoc.monthlyRent || 10000,
    dueDate,
    status: 'pending',
    type: 'rent',
    notes: 'First month rent invoice',
  })

  // 3. Update Property Occupied Units in MongoDB if property exists
  if (requestDoc.propertyId) {
    await Property.findByIdAndUpdate(requestDoc.propertyId, { $inc: { occupiedUnits: 1 } }).catch(() => null)
  }

  // 4. Send Notification to Tenant
  await Notification.create({
    userEmail: requestDoc.tenantEmail.toLowerCase(),
    userId: requestDoc.tenantId,
    title: 'Rental Request Approved! 🎉',
    message: `Congratulations! Your rental request for ${requestDoc.propertyName} was approved by the owner. Your lease and rent details are now active.`,
    type: 'success',
  })

  res.json({
    data: {
      request: formatDoc(requestDoc),
      tenancyId: tenancyDoc._id.toString(),
      message: 'Rental request approved and lease created successfully in database.',
    },
    meta: {},
    error: null,
  })
})

export const rejectRentalRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const requestDoc = await RentalRequest.findById(id)
  if (!requestDoc) throw new NotFoundError('Rental request not found')

  requestDoc.status = 'rejected'
  if (req.body.notes) requestDoc.notes = req.body.notes
  await requestDoc.save()

  // Send Notification to Tenant
  await Notification.create({
    userEmail: requestDoc.tenantEmail.toLowerCase(),
    userId: requestDoc.tenantId,
    title: 'Rental Request Update',
    message: `Your rental request for ${requestDoc.propertyName} was not approved.`,
    type: 'danger',
  })

  res.json({ data: formatDoc(requestDoc), meta: {}, error: null })
})
