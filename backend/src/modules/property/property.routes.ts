import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'

import { env } from '../../config/env.js'
import { authenticate, authorize } from '../auth/auth.middleware.js'
import {
  getProperties,
  searchProperties,
  getProperty,
  getPropertyOwner,
  createProperty,
  updateProperty,
  deleteProperty,
  restoreProperty,
  uploadPropertyImage,
  autocompleteLocation,
} from './property.controller.js'

// Auth rate limit (strict) is for login/register — property CRUD needs a much higher limit
const PROPERTY_RATE_LIMIT = env.NODE_ENV === 'development' ? 500 : 200

const propertyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: PROPERTY_RATE_LIMIT,
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

router.get('/properties', authenticate, propertyLimiter, getProperties)
router.get('/properties/search', propertyLimiter, searchProperties)
router.get('/properties/autocomplete', authenticate, propertyLimiter, autocompleteLocation)
router.get('/properties/:id', propertyLimiter, getProperty)
router.get('/properties/:id/owner', propertyLimiter, getPropertyOwner)

router.post('/properties/upload-image', authenticate, propertyLimiter, uploadPropertyImage)
router.post('/properties', authenticate, authorize('owner', 'admin', 'agent'), propertyLimiter, createProperty)
router.patch('/properties/:id', authenticate, authorize('owner', 'admin', 'agent'), propertyLimiter, updateProperty)
router.delete('/properties/:id', authenticate, authorize('owner', 'admin', 'agent'), propertyLimiter, deleteProperty)
router.post('/properties/:id/restore', authenticate, authorize('owner', 'admin', 'agent'), propertyLimiter, restoreProperty)

export default router
