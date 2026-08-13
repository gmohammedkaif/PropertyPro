import { Router } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { authenticate, authorize } from '../auth/auth.middleware.js'
import {
  approveOwnerRequest,
  listOwnerRequests,
  rejectOwnerRequest,
  listAdminStats,
  listOwners,
  listTenants,
} from './admin.controller.js'

const router = Router()

// Protected Super Admin endpoints
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

router.get(
  '/admin/stats',
  authenticate,
  authorize('admin'),
  asyncHandler(listAdminStats),
)

router.get(
  '/admin/owners',
  authenticate,
  authorize('admin'),
  asyncHandler(listOwners),
)

router.get(
  '/admin/tenants',
  authenticate,
  authorize('admin'),
  asyncHandler(listTenants),
)

export default router
