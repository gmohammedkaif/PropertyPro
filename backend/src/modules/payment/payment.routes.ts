import { Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware.js'
import {
  listPayments,
  getMyPayments,
  createPayment,
  processPayment,
  deletePayment,
} from './payment.controller.js'

const router = Router()

router.get('/payments', authenticate, listPayments)
router.get('/payments/my-payments', authenticate, getMyPayments)
router.post('/payments', authenticate, authorize('owner', 'admin'), createPayment)
router.post('/payments/:id/pay', authenticate, authorize('tenant', 'admin'), processPayment)
router.delete('/payments/:id', authenticate, authorize('owner', 'admin'), deletePayment)

export default router
