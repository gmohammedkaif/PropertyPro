import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'

import { env } from '../../config/env.js'
import { asyncHandler } from '../../core/asyncHandler.js'
import {
  forgotPassword,
  login,
  logout,
  me,
  updateMe,
  changePassword,
  refresh,
  register,
  resetPassword,
  getFamilyMembers,
  updateFamilyMembers,
} from './auth.controller.js'
import { authenticate } from './auth.middleware.js'

// Auth rate limiter: protects login, register, and password reset endpoints.
// /auth/refresh is intentionally excluded — it fires automatically on every page load.
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      data: null,
      meta: {},
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many attempts. Please try again in a few minutes.',
      },
    })
  },
})

const router = Router()

router.post('/auth/register', authLimiter, asyncHandler(register))
router.post('/auth/login', authLimiter, asyncHandler(login))
router.post('/auth/refresh', asyncHandler(refresh))
router.post('/auth/logout', asyncHandler(logout))
router.post('/auth/forgot-password', authLimiter, asyncHandler(forgotPassword))
router.post('/auth/reset-password', authLimiter, asyncHandler(resetPassword))

// Protected routes — any active session
router.get('/auth/me', authenticate, asyncHandler(me))
router.patch('/auth/me', authenticate, asyncHandler(updateMe))
router.post('/auth/change-password', authenticate, asyncHandler(changePassword))
router.get('/auth/family', authenticate, asyncHandler(getFamilyMembers))
router.put('/auth/family', authenticate, asyncHandler(updateFamilyMembers))

export default router
