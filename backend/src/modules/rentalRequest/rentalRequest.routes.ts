import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware.js'
import {
  createRentalRequest,
  listRentalRequests,
  approveRentalRequest,
  rejectRentalRequest,
} from './rentalRequest.controller.js'

const router = Router()

router.post('/rental-requests', authenticate, createRentalRequest)
router.get('/rental-requests', authenticate, listRentalRequests)
router.post('/rental-requests/:id/approve', authenticate, approveRentalRequest)
router.post('/rental-requests/:id/reject', authenticate, rejectRentalRequest)

export default router
