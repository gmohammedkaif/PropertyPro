import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import type { PropertyListResult, PropertyUnit } from '@/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocalPropertyType = 'apartment' | 'house' | 'resort'
export type LocalPropertyListingStatus = 'for-rent' | 'for-sale' | 'occupied' | 'inactive'

export interface LocalProperty {
  id: string
  name: string
  type: LocalPropertyType
  description?: string
  /** Total units (apartments/resort rooms/house floors) */
  totalUnits: number
  /** How many units are currently occupied by tenants */
  occupiedUnits: number
  /** Listing status controls tenant browsing visibility */
  listingStatus: LocalPropertyListingStatus
  /** Optional rich fields for owner-created properties */
  bedrooms?: number
  bathrooms?: number
  parking?: number
  areaSqFt?: number
  monthlyRent?: number
  securityDeposit?: number
  salePrice?: number
  amenities?: string[]
  imageUrl?: string
  images?: string[]
  units?: PropertyUnit[]
  ownerEmail?: string
  ownerId?: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  createdAt: string
}

// ─── Computed helpers ─────────────────────────────────────────────────────────

export function availableUnits(p: LocalProperty): number {
  return Math.max(0, p.totalUnits - p.occupiedUnits)
}

export function isFullyOccupied(p: LocalProperty): boolean {
  return p.occupiedUnits >= p.totalUnits
}

/** House, Apartment, Resort can all have multiple units */
export function isUnitBased(type: LocalPropertyType): boolean {
  return true
}

const SEED: LocalProperty[] = []

interface LocalPropertiesState {
  items: LocalProperty[]
  loadedFromApi: boolean
  fetch: () => Promise<void>
  add: (item: Omit<LocalProperty, 'createdAt'>) => void
  update: (id: string, patch: Partial<LocalProperty>) => void
  remove: (id: string) => void
  incrementOccupied: (propertyId: string, count?: number) => void
  decrementOccupied: (propertyId: string, count?: number) => void
  occupyUnits: (propertyId: string, count?: number) => void
  freeUnits: (propertyId: string, count?: number) => void
  setListingStatus: (propertyId: string, status: LocalPropertyListingStatus) => void
}

export const useLocalPropertiesStore = create<LocalPropertiesState>()((set) => ({
  items: SEED,
  loadedFromApi: false,

  fetch: async () => {
    try {
      const res = await apiClient.get<ApiEnvelope<PropertyListResult>>('/properties')
      const records = res.data?.data?.items ?? []
      if (records.length > 0) {
        const mapped: LocalProperty[] = records.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type as LocalPropertyType,
          description: r.description ?? undefined,
          totalUnits: r.totalUnits ?? r.units?.length ?? 1,
          occupiedUnits: r.occupiedUnits ?? 0,
          listingStatus: (r.listingStatus as LocalPropertyListingStatus) || 'for-rent',
          bedrooms: r.bedrooms,
          bathrooms: r.bathrooms,
          parking: r.parking,
          areaSqFt: r.areaSqFt,
          monthlyRent: r.monthlyRent,
          securityDeposit: (r as any).securityDeposit,
          salePrice: r.salePrice,
          amenities: r.amenities,
          imageUrl: r.imageUrl,
          images: r.images,
          units: r.units ?? [],
          ownerEmail: r.ownerEmail,
          ownerId: r.ownerId,
          address: {
            line1: r.address.line1,
            line2: r.address.line2 ?? undefined,
            city: r.address.city,
            state: r.address.state,
            postalCode: r.address.postalCode,
            country: r.address.country,
          },
          createdAt: r.createdAt,
        }))
        set({ items: mapped, loadedFromApi: true })
      }
    } catch {
      // Keep existing local state on network error
    }
  },

  add: (input) => {
    const newItem: LocalProperty = {
      ...input,
      createdAt: new Date().toISOString(),
    }
    set((state) => {
      const exists = state.items.some((p) => p.id === newItem.id)
      if (exists) {
        return {
          items: state.items.map((p) => (p.id === newItem.id ? { ...p, ...newItem } : p)),
        }
      }
      return { items: [newItem, ...state.items] }
    })
  },

  update: (id, patch) => {
    set((state) => ({
      items: state.items.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  },

  remove: (id) => {
    set((state) => ({
      items: state.items.filter((p) => p.id !== id),
    }))
  },

  incrementOccupied: (propertyId, count = 1) => {
    const inc = Math.max(1, count || 1)
    set((state) => ({
      items: state.items.map((p) => {
        if (p.id !== propertyId) return p
        const nextOccupied = Math.min(p.totalUnits, p.occupiedUnits + inc)
        const nextListing: LocalPropertyListingStatus =
          nextOccupied >= p.totalUnits ? 'occupied' : p.listingStatus
        return { ...p, occupiedUnits: nextOccupied, listingStatus: nextListing }
      }),
    }))
  },

  decrementOccupied: (propertyId, count = 1) => {
    const dec = Math.max(1, count || 1)
    set((state) => ({
      items: state.items.map((p) => {
        if (p.id !== propertyId) return p
        const nextOccupied = Math.max(0, p.occupiedUnits - dec)
        const nextListing: LocalPropertyListingStatus =
          nextOccupied < p.totalUnits && p.listingStatus === 'occupied' ? 'for-rent' : p.listingStatus
        return { ...p, occupiedUnits: nextOccupied, listingStatus: nextListing }
      }),
    }))
  },

  occupyUnits: (propertyId, count = 1) => {
    const inc = Math.max(1, count || 1)
    set((state) => ({
      items: state.items.map((p) => {
        if (p.id !== propertyId) return p
        const nextOccupied = Math.min(p.totalUnits, p.occupiedUnits + inc)
        const nextListing: LocalPropertyListingStatus =
          nextOccupied >= p.totalUnits ? 'occupied' : p.listingStatus
        return { ...p, occupiedUnits: nextOccupied, listingStatus: nextListing }
      }),
    }))
  },

  freeUnits: (propertyId, count = 1) => {
    const dec = Math.max(1, count || 1)
    set((state) => ({
      items: state.items.map((p) => {
        if (p.id !== propertyId) return p
        const nextOccupied = Math.max(0, p.occupiedUnits - dec)
        const nextListing: LocalPropertyListingStatus =
          nextOccupied < p.totalUnits && p.listingStatus === 'occupied' ? 'for-rent' : p.listingStatus
        return { ...p, occupiedUnits: nextOccupied, listingStatus: nextListing }
      }),
    }))
  },

  setListingStatus: (propertyId, listingStatus) => {
    set((state) => ({
      items: state.items.map((p) => (p.id === propertyId ? { ...p, listingStatus } : p)),
    }))
  },
}))
