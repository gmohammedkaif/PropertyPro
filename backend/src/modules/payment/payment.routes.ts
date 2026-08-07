import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware.js'
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
router.post('/payments', authenticate, createPayment)
router.post('/payments/:id/pay', authenticate, processPayment)
router.delete('/payments/:id', authenticate, deletePayment)

export default router
