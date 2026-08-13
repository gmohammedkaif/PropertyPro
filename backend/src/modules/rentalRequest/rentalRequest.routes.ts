import { Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware.js'
import {
  createRentalRequest,
  listRentalRequests,
  approveRentalRequest,
  rejectRentalRequest,
} from './rentalRequest.controller.js'

const router = Router()

router.post('/rental-requests', authenticate, authorize('tenant', 'buyer', 'admin'), createRentalRequest)
router.get('/rental-requests', authenticate, listRentalRequests)
router.post('/rental-requests/:id/approve', authenticate, authorize('owner', 'admin'), approveRentalRequest)
router.post('/rental-requests/:id/reject', authenticate, authorize('owner', 'admin'), rejectRentalRequest)

export default router
