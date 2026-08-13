import type { Request, Response } from 'express'
import { logger } from '../../core/logger.js'

import { asyncHandler } from '../../core/asyncHandler.js'
import { ForbiddenError, ConflictError, BadRequestError } from '../../core/errors.js'
import { Tenancy } from '../tenancy/tenancy.model.js'
import { propertyService } from './property.service.js'
import { uploadPropertyImageToImageKit } from './imagekit.service.js'
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFilterSchema,
  propertyIdSchema,
} from './property.schemas.js'

export const getProperties = asyncHandler(async (req: Request, res: Response) => {
  const filter = propertyFilterSchema.parse(req.query)
  const isOwner = req.user?.roles.includes('owner') && !req.user?.roles.includes('admin')
  const isAdmin = req.user?.roles.includes('admin')
  if (isOwner && req.user?.id) {
    filter.ownerId = req.user.id
  }
  const result = isOwner && req.user?.id
    ? await propertyService.findByOwner(req.user.id, filter)
    : isAdmin
    ? await propertyService.findAll(filter)
    : await propertyService.listPublished(filter)
  res.json({ data: result, meta: {}, error: null })
})

export const searchProperties = asyncHandler(async (req: Request, res: Response) => {
  const filter = propertyFilterSchema.parse(req.query)
  const q = req.query.q as string | undefined
  const result = q
    ? await propertyService.search(q, filter)
    : await propertyService.listPublished(filter)
  res.json({ data: result, meta: {}, error: null })
})

export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = propertyIdSchema.parse(req.params)
  const property = await propertyService.findById(id)
  res.json({ data: property, meta: {}, error: null })
})

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user?.roles.includes('admin')
  const ownerId = (isAdmin && req.body.ownerId) ? req.body.ownerId : req.user?.id
  const ownerEmail = (isAdmin && req.body.ownerEmail) ? req.body.ownerEmail : req.user?.email
  const input = createPropertySchema.parse({
    ...req.body,
    ownerId,
    ownerEmail,
  })
  const property = await propertyService.create(input)
  res.status(201).json({ data: property, meta: {}, error: null })
})

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = propertyIdSchema.parse(req.params)
  const existing = await propertyService.findById(id)
  if (existing.ownerId !== req.user?.id && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to modify this property')
  }
  const input = updatePropertySchema.parse(req.body)
  const property = await propertyService.update(id, input)
  res.json({ data: property, meta: {}, error: null })
})

export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = propertyIdSchema.parse(req.params)
  const existing = await propertyService.findById(id)
  if (existing.ownerId !== req.user?.id && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to delete this property')
  }
  const activeTenancy = await Tenancy.findOne({ propertyId: id, status: { $in: ['active', 'expiring-soon'] } }).lean()
  if (activeTenancy) {
    throw new ConflictError('Cannot delete a property with an active tenancy lease')
  }
  const property = await propertyService.delete(id)
  res.json({ data: property, meta: {}, error: null })
})

export const restoreProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = propertyIdSchema.parse(req.params)
  const existing = await propertyService.findById(id)
  if (existing.ownerId !== req.user?.id && !req.user?.roles.includes('admin')) {
    throw new ForbiddenError('You do not have permission to restore this property')
  }
  const property = await propertyService.restore(id)
  res.json({ data: property, meta: {}, error: null })
})

export const uploadPropertyImage = asyncHandler(async (req: Request, res: Response) => {
  const { file, fileName } = req.body
  if (!file) {
    throw new BadRequestError('Please upload at least one property image.')
  }
  const url = await uploadPropertyImageToImageKit(file, fileName || `property_${Date.now()}.jpg`)
  res.json({ data: { url }, meta: {}, error: null })
})

export const autocompleteLocation = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined
  if (!q || q.trim().length < 2) {
    res.json({ data: [], meta: {}, error: null })
    return
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PropertyPro/1.0.0 (contact@propertypro.com)',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API returned status ${response.status}`)
    }

    const results = (await response.json()) as any[]

    const formatted = results
      .map((item) => {
        const addr = item.address || {}
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || ''
        const state = addr.state || addr.region || ''
        const country = addr.country || ''
        const countryCode = addr.country_code ? addr.country_code.toUpperCase() : ''
        const postalCode = addr.postcode || ''

        const labelParts = [city, state, country].filter(Boolean)
        const label = labelParts.length > 0 ? labelParts.join(', ') : item.display_name

        return {
          label,
          city,
          state,
          postalCode,
          country,
          countryCode,
        }
      })
      .filter((item) => item.city)

    res.json({ data: formatted, meta: {}, error: null })
  } catch (error: any) {
    logger.error(error, 'Error fetching location autocomplete suggestions')
    res.json({ data: [], meta: {}, error: null })
  }
})
