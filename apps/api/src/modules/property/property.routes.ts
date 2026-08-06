import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'

import { env } from '../../config/env.js'
import { authenticate } from '../auth/auth.middleware.js'
import {
  getProperties,
  searchProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  restoreProperty,
} from './property.controller.js'

const propertyLimiter = rateLimit({
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
        message: 'Too many requests. Please try again in a few minutes.',
      },
    })
  },
})

const router = Router()

router.get('/properties', propertyLimiter, getProperties)
router.get('/properties/search', propertyLimiter, searchProperties)
router.get('/properties/:id', propertyLimiter, getProperty)

router.post('/properties', authenticate, propertyLimiter, createProperty)
router.patch('/properties/:id', authenticate, propertyLimiter, updateProperty)
router.delete('/properties/:id', authenticate, propertyLimiter, deleteProperty)
router.post('/properties/:id/restore', authenticate, propertyLimiter, restoreProperty)

export default router
