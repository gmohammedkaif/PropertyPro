import { Router } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { authenticate, authorize } from '../auth/auth.middleware.js'
import {
  approveOwnerRequest,
  listOwnerRequests,
  rejectOwnerRequest,
} from './admin.controller.js'

const router = Router()

// Protected Super Admin endpoints for managing owner requests
router.get(
  '/admin/owner-requests',
  authenticate,
  authorize('admin'),
  asyncHandler(listOwnerRequests),
)

router.patch(
  '/admin/owner-requests/:id/approve',
  authenticate,
  authorize('admin'),
  asyncHandler(approveOwnerRequest),
)

router.patch(
  '/admin/owner-requests/:id/reject',
  authenticate,
  authorize('admin'),
  asyncHandler(rejectOwnerRequest),
)

export default router
