import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware.js'
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from './notification.controller.js'

const router = Router()

router.get('/notifications', authenticate, listNotifications)
router.patch('/notifications/:id/read', authenticate, markAsRead)
router.post('/notifications/read-all', authenticate, markAllAsRead)
router.delete('/notifications/:id', authenticate, deleteNotification)

export default router
