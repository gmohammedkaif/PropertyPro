import { z } from 'zod'

const address = z.object({
  line1: z.string().trim().min(1, 'Address line 1 is required').max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  postalCode: z.string().trim().min(1, 'Postal code is required').max(20),
  country: z.string().trim().min(1, 'Country is required').max(100),
})

const location = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
})

export const createPropertySchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  name: z.string().trim().min(1, 'Name is required').max(200),
  type: z.enum(['apartment', 'house', 'commercial', 'mixed']),
  address,
  location: location.optional(),
  description: z.string().trim().max(2000).optional(),
  amenities: z.array(z.string()).max(50).optional(),
  totalUnits: z.coerce.number().int().min(0).max(99999).optional(),
})
export type CreatePropertyInput = z.infer<typeof createPropertySchema>

export const updatePropertySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  type: z.enum(['apartment', 'house', 'commercial', 'mixed']).optional(),
  address: address.partial().optional(),
  location: location.optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  amenities: z.array(z.string()).max(50).optional(),
  totalUnits: z.coerce.number().int().min(0).max(99999).optional(),
  status: z.enum(['active', 'archived']).optional(),
})
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>

export const propertyFilterSchema = z.object({
  search: z.string().trim().max(200).optional(),
  ownerId: z.string().optional(),
  type: z.enum(['apartment', 'house', 'commercial', 'mixed']).optional(),
  status: z.enum(['active', 'archived']).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  sort: z.enum(['createdAt', 'name', 'type', 'status', 'totalUnits']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})
export type PropertyFilter = z.infer<typeof propertyFilterSchema>

export const propertyIdSchema = z.object({
  id: z.string().uuid('Invalid property ID'),
})
export type PropertyIdInput = z.infer<typeof propertyIdSchema>
