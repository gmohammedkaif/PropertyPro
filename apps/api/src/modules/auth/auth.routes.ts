import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'

import { env } from '../../config/env.js'
import { asyncHandler } from '../../core/asyncHandler.js'
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
} from './auth.controller.js'
import { authenticate } from './auth.middleware.js'

// API.md §16 — auth tier: 10 requests / 5 minutes (configurable for tests).
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
router.post('/auth/refresh', authLimiter, asyncHandler(refresh))
router.post('/auth/logout', authLimiter, asyncHandler(logout))
router.post('/auth/forgot-password', authLimiter, asyncHandler(forgotPassword))
router.post('/auth/reset-password', authLimiter, asyncHandler(resetPassword))

// Protected route — demonstrates authentication middleware (any active session).
router.get('/auth/me', authenticate, asyncHandler(me))

export default router
