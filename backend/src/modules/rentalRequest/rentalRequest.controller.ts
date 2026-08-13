import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { NotFoundError, ForbiddenError, ConflictError } from '../../core/errors.js'
import { RentalRequest } from './rentalRequest.model.js'
import { Tenancy } from '../tenancy/tenancy.model.js'
import { Payment } from '../payment/payment.model.js'
import { Notification, createNotificationIdempotent } from '../notification/notification.model.js'
import { Property } from '../property/models/property.model.js'
import { User } from '../auth/models/user.model.js'

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
  const tenantEmail = req.user?.email || 'tenant@propertypro.app'

  const property = await Property.findById(req.body.propertyId).lean().catch(() => null)
  if (!property) throw new NotFoundError('Property not found')
  if (property.status === 'archived') throw new ForbiddenError('This property is archived')

  const ownerId = property.ownerId
  let ownerEmail = property.ownerEmail
  if (!ownerEmail) {
    const ownerUser = await User.findById(ownerId).lean()
    ownerEmail = ownerUser ? ownerUser.email : 'owner@propertypro.com'
  }

  const doc = await RentalRequest.create({
    propertyId: req.body.propertyId,
    propertyName: req.body.propertyName || property.name,
    propertyType: req.body.propertyType || property.type,
    ownerId,
    ownerEmail,
    tenantId,
    tenantEmail,
    fullName: req.body.fullName,
    mobileNumber: req.body.mobileNumber,
    city: req.body.city,
    monthlyRent: req.body.monthlyRent || (property as any).monthlyRent || 0,
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

  if (requestDoc.ownerId !== req.user?.id && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to approve this request')
  }

  if (requestDoc.status !== 'pending') {
    throw new ConflictError('This request has already been processed')
  }

  // Check if property has active tenancy
  const activeTenancy = await Tenancy.findOne({
    propertyId: requestDoc.propertyId,
    status: { $in: ['active', 'expiring-soon'] },
  }).lean()
  if (activeTenancy) {
    throw new ConflictError('This property already has an active tenancy lease')
  }

  requestDoc.status = 'approved'
  await requestDoc.save()

  // Calculate lease dates: prefer values from request body (sent from LeaseCreationModal)
  const leaseStartRaw = req.body.leaseStart ? new Date(req.body.leaseStart) : new Date()
  const leaseDurationMonths = Number(req.body.leaseDurationMonths) || 12
  const leaseEndRaw = new Date(leaseStartRaw)
  leaseEndRaw.setMonth(leaseEndRaw.getMonth() + leaseDurationMonths)

  // 1. Create Tenancy (Lease Document) in MongoDB
  const tenancyDoc = await Tenancy.create({
    tenantName: requestDoc.fullName,
    tenantEmail: requestDoc.tenantEmail.toLowerCase(),
    tenantPhone: requestDoc.mobileNumber,
    propertyId: requestDoc.propertyId,
    propertyName: requestDoc.propertyName,
    unitNumber: req.body.unitNumber || 'Main',
    unitsOccupied: 1,
    leaseStart: leaseStartRaw,
    leaseEnd: leaseEndRaw,
    leaseDurationMonths,
    monthlyRent: Number(req.body.monthlyRent) || requestDoc.monthlyRent || 10000,
    securityDeposit: Number(req.body.securityDeposit) || (requestDoc.monthlyRent || 10000) * 2,
    leaseNotes: req.body.leaseNotes || 'Standard lease agreement.',
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
    ownerId: requestDoc.ownerId,
    ownerEmail: requestDoc.ownerEmail.toLowerCase(),
    tenancyId: tenancyDoc._id.toString(),
  })

  // 3. Update Property Occupied Units in MongoDB if property exists
  if (requestDoc.propertyId) {
    await Property.findByIdAndUpdate(requestDoc.propertyId, { $inc: { occupiedUnits: 1 } }).catch(() => null)

    // Auto-reject other pending rental requests for the same property
    const otherPending = await RentalRequest.find({
      propertyId: requestDoc.propertyId,
      _id: { $ne: requestDoc._id },
      status: 'pending',
    }).lean().catch(() => [])

    await RentalRequest.updateMany(
      {
        propertyId: requestDoc.propertyId,
        _id: { $ne: requestDoc._id },
        status: 'pending',
      },
      {
        $set: {
          status: 'rejected',
          notes: 'Property leased to another applicant',
        },
      },
    ).catch(() => null)

    for (const otherReq of otherPending) {
      if (otherReq.tenantEmail) {
        await createNotificationIdempotent({
          userEmail: otherReq.tenantEmail,
          userId: otherReq.tenantId,
          title: 'Rental Request Status Update ❌',
          message: `Your rental request for ${otherReq.propertyName} was not accepted because the property has been leased to another applicant.`,
          type: 'warning',
          eventType: 'REQUEST_AUTO_REJECTED',
          relatedEntityId: otherReq._id.toString(),
        })
      }
    }
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

  if (requestDoc.ownerId !== req.user?.id && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to reject this request')
  }

  if (requestDoc.status === 'approved') {
    throw new ConflictError('This request has already been processed')
  }

  if (requestDoc.status === 'rejected') {
    if (req.body.notes) {
      requestDoc.notes = req.body.notes
      await requestDoc.save()
    }
    return res.json({ data: formatDoc(requestDoc), meta: {}, error: null })
  }

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
