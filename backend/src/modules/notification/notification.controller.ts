import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors.js'
import { Notification, createNotificationIdempotent } from './notification.model.js'

function formatDoc(doc: any) {
  return {
    id: doc._id.toString(),
    userEmail: doc.userEmail,
    userId: doc.userId,
    title: doc.title,
    message: doc.message,
    type: doc.type,
    read: doc.read,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
  }
}

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { userEmail, title, message, type, eventType, relatedEntityId } = req.body

  if (!userEmail || !title || !message) {
    throw new BadRequestError('userEmail, title, and message are required')
  }

  const doc = await createNotificationIdempotent({
    userEmail: String(userEmail).toLowerCase().trim(),
    userId: req.user?.id || '',
    title: String(title).trim(),
    message: String(message).trim(),
    type: type || 'info',
    eventType,
    relatedEntityId,
  })

  res.status(201).json({ data: formatDoc(doc), meta: {}, error: null })
})

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userEmail = req.user?.email?.toLowerCase()
  if (!userEmail) throw new NotFoundError('User email not found in session')

  const items = await Notification.find({ userEmail }).sort({ createdAt: -1 }).limit(50).lean()
  res.json({ data: items.map(formatDoc), meta: { total: items.length }, error: null })
})

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const notification = await Notification.findById(id)
  if (!notification) throw new NotFoundError('Notification not found')

  if (notification.userEmail.toLowerCase() !== req.user?.email?.toLowerCase() && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to modify this notification')
  }

  const updated = await Notification.findByIdAndUpdate(id, { read: true }, { new: true }).lean()
  res.json({ data: formatDoc(updated!), meta: {}, error: null })
})

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userEmail = req.user?.email?.toLowerCase()
  if (!userEmail) throw new NotFoundError('User email not found in session')

  await Notification.updateMany({ userEmail }, { read: true })
  res.json({ data: { message: 'All notifications marked as read' }, meta: {}, error: null })
})

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const notification = await Notification.findById(id)
  if (!notification) throw new NotFoundError('Notification not found')

  if (notification.userEmail.toLowerCase() !== req.user?.email?.toLowerCase() && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to delete this notification')
  }

  const deleted = await Notification.findByIdAndDelete(id).lean()
  res.json({ data: formatDoc(deleted!), meta: {}, error: null })
})
