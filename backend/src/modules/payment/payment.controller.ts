import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { NotFoundError, ForbiddenError, ConflictError } from '../../core/errors.js'
import { Payment } from './payment.model.js'
import { Notification } from '../notification/notification.model.js'
import { Tenancy } from '../tenancy/tenancy.model.js'
import { sweepPaymentOverdues } from './paymentOverdue.service.js'

function formatDoc(doc: any) {
  return {
    id: doc._id.toString(),
    tenantName: doc.tenantName,
    tenantEmail: doc.tenantEmail,
    propertyId: doc.propertyId,
    propertyName: doc.propertyName,
    amount: doc.amount,
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    paidDate: doc.paidDate ? doc.paidDate.toISOString() : null,
    status: doc.status,
    type: doc.type,
    notes: doc.notes,
    ownerId: doc.ownerId,
    ownerEmail: doc.ownerEmail,
    tenancyId: doc.tenancyId,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  }
}

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  // Trigger overdue sweep to ensure fresh statuses
  await sweepPaymentOverdues()

  const user = req.user
  const isSuperAdmin = user?.roles.includes('admin') || user?.email === 'admin@propertypro.com'
  const isOwner = user?.roles.includes('owner') || user?.roles.includes('agent')

  let query: Record<string, unknown> = {}

  if (!isSuperAdmin) {
    if (isOwner) {
      // Find payments owned by this owner directly
      query = { ownerId: user?.id }
    } else {
      query = { tenantEmail: user?.email?.toLowerCase() }
    }
  }

  const items = await Payment.find(query).sort({ dueDate: -1 }).lean()
  res.json({ data: items.map(formatDoc), meta: { total: items.length }, error: null })
})

export const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  // Trigger overdue sweep to ensure fresh statuses
  await sweepPaymentOverdues()

  const tenantEmail = req.user?.email?.toLowerCase()
  if (!tenantEmail) throw new NotFoundError('Tenant email not found in session')

  const items = await Payment.find({ tenantEmail }).sort({ dueDate: -1 }).lean()
  res.json({ data: items.map(formatDoc), meta: { total: items.length }, error: null })
})

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.user?.id || ''
  const ownerEmail = req.user?.email || ''

  const tenancy = await Tenancy.findOne({
    tenantEmail: req.body.tenantEmail.toLowerCase(),
    propertyId: req.body.propertyId,
    status: { $in: ['active', 'expiring-soon'] },
  }).lean()

  if (!tenancy) {
    throw new NotFoundError('No active lease/tenancy found for this tenant and property')
  }

  if (tenancy.ownerId !== ownerId && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to manage this tenancy lease')
  }

  const doc = await Payment.create({
    tenantName: req.body.tenantName,
    tenantEmail: req.body.tenantEmail.toLowerCase(),
    propertyId: req.body.propertyId || '',
    propertyName: req.body.propertyName || tenancy.propertyName,
    amount: req.body.amount,
    dueDate: new Date(req.body.dueDate),
    status: req.body.status || 'pending',
    type: req.body.type || 'rent',
    notes: req.body.notes || '',
    ownerId,
    ownerEmail,
    tenancyId: tenancy._id.toString(),
  })

  res.status(201).json({ data: formatDoc(doc), meta: {}, error: null })
})

export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const paymentDoc = await Payment.findById(id)
  if (!paymentDoc) throw new NotFoundError('Payment invoice not found')

  if (paymentDoc.tenantEmail.toLowerCase() !== req.user?.email?.toLowerCase() && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to pay this invoice')
  }

  if (paymentDoc.status === 'paid') {
    throw new ConflictError('This payment has already been paid')
  }

  paymentDoc.status = 'paid'
  paymentDoc.paidDate = new Date()
  await paymentDoc.save()

  // Notify tenant
  await Notification.create({
    userEmail: paymentDoc.tenantEmail.toLowerCase(),
    userId: '',
    title: 'Rent Payment Successful 🎉',
    message: `Your payment of ₹${paymentDoc.amount.toLocaleString('en-IN')} for ${paymentDoc.propertyName} was received. Official receipt generated.`,
    type: 'success',
  })

  res.json({ data: formatDoc(paymentDoc), meta: {}, error: null })
})

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const paymentDoc = await Payment.findById(id)
  if (!paymentDoc) throw new NotFoundError('Payment not found')

  if (paymentDoc.ownerId !== req.user?.id && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to delete this payment invoice')
  }

  const deleted = await Payment.findByIdAndDelete(id).lean()
  res.json({ data: formatDoc(deleted!), meta: {}, error: null })
})
