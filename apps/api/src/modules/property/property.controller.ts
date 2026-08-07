import type { Request, Response } from 'express'

import { asyncHandler } from '../../core/asyncHandler.js'
import { propertyService } from './property.service.js'
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFilterSchema,
  propertyIdSchema,
} from './property.schemas.js'

export const getProperties = asyncHandler(async (req: Request, res: Response) => {
  const filter = propertyFilterSchema.parse(req.query)
  const isOwner = req.user?.roles.includes('owner') && !req.user?.roles.includes('admin')
  if (isOwner && req.user?.id) {
    filter.ownerId = req.user.id
  }
  const result = isOwner && req.user?.id
    ? await propertyService.findByOwner(req.user.id, filter)
    : await propertyService.listPublished(filter)
  res.json({ data: result, meta: {}, error: null })
})

export const searchProperties = asyncHandler(async (req: Request, res: Response) => {
  const filter = propertyFilterSchema.parse(req.query)
  const q = req.query.q as string | undefined
  if (!q) {
    res.json({ data: { items: [], nextCursor: null, total: 0 }, meta: {}, error: null })
    return
  }
  const result = await propertyService.search(q, filter)
  res.json({ data: result, meta: {}, error: null })
})

export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = propertyIdSchema.parse(req.params)
  const property = await propertyService.findById(id)
  res.json({ data: property, meta: {}, error: null })
})

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.body.ownerId || req.user?.id
  const input = createPropertySchema.parse({
    ...req.body,
    ownerId,
  })
  const property = await propertyService.create(input)
  res.status(201).json({ data: property, meta: {}, error: null })
})

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = propertyIdSchema.parse(req.params)
  const input = updatePropertySchema.parse(req.body)
  const property = await propertyService.update(id, input)
  res.json({ data: property, meta: {}, error: null })
})

export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = propertyIdSchema.parse(req.params)
  const property = await propertyService.delete(id)
  res.json({ data: property, meta: {}, error: null })
})

export const restoreProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = propertyIdSchema.parse(req.params)
  const property = await propertyService.restore(id)
  res.json({ data: property, meta: {}, error: null })
})
