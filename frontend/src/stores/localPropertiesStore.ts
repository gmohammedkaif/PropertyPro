import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import type { PropertyListResult } from '@/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocalPropertyType = 'apartment' | 'house' | 'villa' | 'commercial' | 'mixed'
export type LocalPropertyListingStatus = 'for-rent' | 'for-sale' | 'occupied' | 'inactive'

export interface LocalProperty {
  id: string
  name: string
  type: LocalPropertyType
  description?: string
  /** Total units (apartments). House/Villa = 1 */
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
  salePrice?: number
  amenities?: string[]
  imageUrl?: string
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

/** House & Villa have only 1 unit — no unit count shown, just occupied/available */
export function isUnitBased(type: LocalPropertyType): boolean {
  return type === 'apartment' || type === 'commercial' || type === 'mixed'
}

// Seed data not needed for business data store of truth, but initialized empty
const SEED: LocalProperty[] = []

// ─── Store ────────────────────────────────────────────────────────────────────

interface LocalPropertiesState {
  items: LocalProperty[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  add: (p: any) => LocalProperty
  update: (id: string, changes: Partial<any>) => void
  remove: (id: string) => void
  /** Called when a tenancy is created: occupies units on the property */
  occupyUnits: (propertyId: string, units: number) => void
  /** Called when a tenancy is terminated: frees units */
  freeUnits: (propertyId: string, units: number) => void
  /** Explicitly set the listing status of a property */
  setListingStatus: (propertyId: string, status: LocalPropertyListingStatus) => void
}

export const useLocalPropertiesStore = create<LocalPropertiesState>()(
  (set) => ({
    items: [],
    isLoading: false,
    error: null,

    fetch: async () => {
      set({ isLoading: true })
      try {
        const { data } = await apiClient.get<ApiEnvelope<PropertyListResult>>('/properties')
        if (data.data) {
          const mapped = data.data.items.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type as LocalPropertyType,
            description: p.description ?? undefined,
            totalUnits: p.totalUnits ?? 0,
            occupiedUnits: p.occupiedUnits ?? 0,
            listingStatus: (p as any).listingStatus ?? 'inactive',
            bedrooms: (p as any).bedrooms,
            bathrooms: (p as any).bathrooms,
            parking: (p as any).parking,
            areaSqFt: (p as any).areaSqFt,
            monthlyRent: (p as any).monthlyRent,
            salePrice: (p as any).salePrice,
            imageUrl: (p as any).imageUrl,
            ownerEmail: (p as any).ownerEmail,
            ownerId: p.ownerId,
            address: {
              line1: p.address.line1,
              line2: p.address.line2 ?? undefined,
              city: p.address.city,
              state: p.address.state,
              postalCode: p.address.postalCode,
              country: p.address.country,
            },
            createdAt: p.createdAt,
          }))
          set({ items: mapped, error: null })
        }
      } catch (err: any) {
        set({ error: err })
      } finally {
        set({ isLoading: false })
      }
    },

    add: (p) => {
      const now = new Date().toISOString()
      const record: LocalProperty = { ...p, id: p.id || crypto.randomUUID(), createdAt: p.createdAt || now }
      set((state) => ({ items: [record, ...state.items] }))
      return record
    },

    update: (id, changes) => {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      }))
    },

    remove: (id) => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
    },

    occupyUnits: (propertyId, units) => {
      set((state) => ({
        items: state.items.map((item) => {
          if (item.id !== propertyId) return item
          const newOccupied = Math.min(item.totalUnits, item.occupiedUnits + units)
          const fullyOccupied = newOccupied >= item.totalUnits
          return {
            ...item,
            occupiedUnits: newOccupied,
            listingStatus: fullyOccupied ? 'occupied' : item.listingStatus,
          }
        }),
      }))
    },

    freeUnits: (propertyId, units) => {
      set((state) => ({
        items: state.items.map((item) => {
          if (item.id !== propertyId) return item
          const newOccupied = Math.max(0, item.occupiedUnits - units)
          return {
            ...item,
            occupiedUnits: newOccupied,
            listingStatus: item.listingStatus === 'occupied' ? 'for-rent' : item.listingStatus,
          }
        }),
      }))
    },

    setListingStatus: (propertyId, status) => {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === propertyId ? { ...item, listingStatus: status } : item,
        ),
      }))
    },
  }),
)
