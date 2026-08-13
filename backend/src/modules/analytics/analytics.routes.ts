import { Router } from 'express'
import { asyncHandler } from '../../core/asyncHandler.js'
import { authenticate, authorize } from '../auth/auth.middleware.js'
import { getAnalyticsOverview } from './analytics.controller.js'

const router = Router()

// Protected analytics endpoints (Admin & Owner access)
router.get(
  '/analytics/overview',
  authenticate,
  authorize('admin', 'owner', 'agent'),
  asyncHandler(getAnalyticsOverview),
)

export default router
