export interface PropertyRecord {
  id: string
  ownerId: string
  name: string
  type: PropertyType
  address: {
    line1: string
    line2: string | null
    city: string
    state: string
    postalCode: string
    country: string
  }
  location: {
    type: 'Point'
    coordinates: [number, number]
  } | null
  description: string | null
  amenities: string[]
  totalUnits: number
  occupiedUnits: number
  status: PropertyStatus
  images: string[]
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'mixed'

export type PropertyStatus = 'active' | 'archived'

export interface CreatePropertyInput {
  ownerId: string
  name: string
  type: PropertyType
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  location?: {
    type: 'Point'
    coordinates: [number, number]
  }
  description?: string
  amenities?: string[]
  totalUnits?: number
}

export interface UpdatePropertyInput {
  name?: string
  type?: PropertyType
  address?: Partial<PropertyRecord['address']>
  location?: { type: 'Point'; coordinates: [number, number] }
  description?: string | null
  amenities?: string[]
  totalUnits?: number
  status?: PropertyStatus
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
  nextCursor: string | null
  total: number
}