import type { Request, Response } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { NotFoundError } from '../../core/errors.js'
import { Notification } from './notification.model.js'

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

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userEmail = req.user?.email?.toLowerCase()
  if (!userEmail) throw new NotFoundError('User email not found in session')

  const items = await Notification.find({ userEmail }).sort({ createdAt: -1 }).limit(50).lean()
  res.json({ data: items.map(formatDoc), meta: { total: items.length }, error: null })
})

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const updated = await Notification.findByIdAndUpdate(id, { read: true }, { new: true }).lean()
  if (!updated) throw new NotFoundError('Notification not found')
  res.json({ data: formatDoc(updated), meta: {}, error: null })
})

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userEmail = req.user?.email?.toLowerCase()
  if (!userEmail) throw new NotFoundError('User email not found in session')

  await Notification.updateMany({ userEmail }, { read: true })
  res.json({ data: { message: 'All notifications marked as read' }, meta: {}, error: null })
})

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const deleted = await Notification.findByIdAndDelete(id).lean()
  if (!deleted) throw new NotFoundError('Notification not found')
  res.json({ data: formatDoc(deleted), meta: {}, error: null })
})
