import { z } from 'zod'

/** PropertyPro — shared domain contract.
 *
 * Single source of truth for constants and types consumed by both the web
 * app and the API. Keep this package dependency-free so it builds quickly
 * and can be shared across every runtime.
 */

export const APP_NAME = 'PropertyPro'
export const APP_VERSION = '0.1.0'
export const API_PREFIX = '/api/v1'
export const API_VERSION = 'v1'

export const ROLE_LIST = ['admin', 'owner', 'agent', 'buyer', 'tenant', 'maintenance'] as const
export type Role = (typeof ROLE_LIST)[number]

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export type ThemeMode = 'light' | 'dark' | 'system'

/** User lifecycle states. */
export const USER_STATUS_LIST = ['pending_verification', 'pending_approval', 'active', 'suspended', 'rejected'] as const
export type UserStatus = (typeof USER_STATUS_LIST)[number]

/** Non-sensitive, serialized view of the authenticated user (safe for the client). */
export interface AuthUser {
  id: string
  email: string
  name: string
  phone: string
  roles: Role[]
  status: UserStatus
  avatarUrl?: string
}

/** Refresh-token cookie name (HttpOnly) used by the API and referenced conceptually by the SPA. */
export const AUTH_REFRESH_COOKIE = 'pp_refresh'

export const THEME_STORAGE_KEY = 'propertypro-theme'
export const AUTH_STORAGE_KEY = 'propertypro-auth'

/** PropertyPro Property types. */

export type PropertyType = 'apartment' | 'house' | 'resort'
export type PropertyStatus = 'active' | 'archived'

export interface PropertyUnit {
  unitNumber: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  areaSqFt?: number
  monthlyRent: number
  securityDeposit?: number
  floor?: string
}

export interface Address {
  line1: string
  line2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Location {
  type: 'Point'
  coordinates: [number, number]
}

export interface PropertyRecord {
  id: string
  ownerId: string
  name: string
  type: PropertyType
  address: Address
  location?: Location | null
  description?: string | null
  amenities?: string[]
  totalUnits?: number
  occupiedUnits?: number
  status: PropertyStatus
  imageUrl?: string
  images?: string[]
  units?: PropertyUnit[]
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  listingStatus?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  areaSqFt?: number
  monthlyRent?: number
  securityDeposit?: number
  salePrice?: number
  ownerEmail?: string
}

export interface CreatePropertyInput {
  ownerId: string
  ownerEmail?: string
  name: string
  type: PropertyType
  address: Address
  location?: Location
  description?: string
  amenities?: string[]
  totalUnits?: number
  occupiedUnits?: number
  imageUrl?: string
  images?: string[]
  units?: PropertyUnit[]
  listingStatus?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  areaSqFt?: number
  monthlyRent?: number
  securityDeposit?: number
  salePrice?: number
}

export interface UpdatePropertyInput {
  name?: string
  type?: PropertyType
  address?: Partial<Address>
  location?: Location
  description?: string | null
  amenities?: string[]
  totalUnits?: number
  status?: PropertyStatus
  imageUrl?: string
  images?: string[]
  units?: PropertyUnit[]
  listingStatus?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  areaSqFt?: number
  monthlyRent?: number
  securityDeposit?: number
  salePrice?: number
  ownerEmail?: string
}

export interface PropertyFilter {
  search?: string
  ownerId?: string
  type?: PropertyType
  status?: PropertyStatus
  city?: string
  state?: string
  sort?: string
  order?: 'asc' | 'desc'
  cursor?: string
  limit?: number
}

export interface PropertyListResult {
  items: PropertyRecord[]
  nextCursor?: string | null
  total: number
}

/** Zod schemas for property validation. */
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

const propertyUnitSchema = z.object({
  unitNumber: z.string().trim().min(1, 'Unit number is required'),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  parking: z.number().min(0).optional(),
  areaSqFt: z.number().min(0).optional(),
  monthlyRent: z.number().min(0, 'Monthly rent must be >= 0'),
  securityDeposit: z.number().min(0).optional(),
  floor: z.string().optional(),
})

export const createPropertySchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  name: z.string().trim().min(1, 'Name is required').max(200),
  type: z.enum(['apartment', 'house', 'resort']),
  address,
  location: location.optional(),
  description: z.string().trim().max(2000).optional(),
  amenities: z.array(z.string()).max(50).optional(),
  totalUnits: z.coerce.number().int().min(0).max(99999).optional(),
  units: z.array(propertyUnitSchema).optional(),
})
export type CreatePropertySchemaInput = z.infer<typeof createPropertySchema>

export const updatePropertySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  type: z.enum(['apartment', 'house', 'resort']).optional(),
  address: address.partial().optional(),
  location: location.optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  amenities: z.array(z.string()).max(50).optional(),
  totalUnits: z.coerce.number().int().min(0).max(99999).optional(),
  units: z.array(propertyUnitSchema).optional(),
  status: z.enum(['active', 'archived']).optional(),
})
export type UpdatePropertySchemaInput = z.infer<typeof updatePropertySchema>

export const propertyFilterSchema = z.object({
  search: z.string().trim().max(200).optional(),
  type: z.enum(['apartment', 'house', 'resort']).optional(),
  status: z.enum(['active', 'archived']).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  sort: z.enum(['createdAt', 'name', 'type', 'status', 'totalUnits']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})
export type PropertyFilterSchemaInput = z.infer<typeof propertyFilterSchema>

export const propertyIdSchema = z.object({
  id: z.string().uuid('Invalid property ID'),
})
export type PropertyIdSchemaInput = z.infer<typeof propertyIdSchema>
