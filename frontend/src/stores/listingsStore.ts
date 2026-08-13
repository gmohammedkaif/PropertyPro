import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import type { PropertyListResult } from '@/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListingType = 'rent' | 'sale'
export type ListingStatus = 'available' | 'under-offer' | 'rented' | 'sold'

export interface ListingRecord {
  id: string
  propertyName: string
  type: ListingType
  status: ListingStatus
  price: number
  bedrooms?: number
  bathrooms?: number
  areaSqFt?: number
  description?: string
  createdAt: string
  updatedAt: string
}

// Seed data not needed for business data store of truth, but initialized empty
const SEED: ListingRecord[] = []

// ─── Store ────────────────────────────────────────────────────────────────────

interface ListingsState {
  items: ListingRecord[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  add: (listing: any) => ListingRecord
  update: (id: string, changes: Partial<any>) => void
  remove: (id: string) => void
}

export const useListingsStore = create<ListingsState>()(
  (set) => ({
    items: [],
    isLoading: false,
    error: null,

    fetch: async () => {
      set({ isLoading: true })
      try {
        const { data } = await apiClient.get<ApiEnvelope<PropertyListResult>>('/properties')
        if (data.data) {
          // Filter to properties that have active listing status (for-rent or for-sale)
          const listed = data.data.items.filter(
            (p) => (p as any).listingStatus === 'for-rent' || (p as any).listingStatus === 'for-sale' || (p as any).listingStatus === 'occupied'
          )
          const mapped = listed.map((p) => ({
            id: p.id,
            propertyName: p.name,
            type: ((p as any).listingStatus === 'for-sale' ? 'sale' : 'rent') as ListingType,
            status: ((p as any).listingStatus === 'occupied' ? 'rented' : 'available') as ListingStatus,
            price: (p as any).listingStatus === 'for-sale' ? ((p as any).salePrice || 0) : ((p as any).monthlyRent || 0),
            bedrooms: (p as any).bedrooms,
            bathrooms: (p as any).bathrooms,
            areaSqFt: (p as any).areaSqFt,
            description: p.description ?? undefined,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }))
          set({ items: mapped, error: null })
        }
      } catch (err: any) {
        set({ error: err })
      } finally {
        set({ isLoading: false })
      }
    },

    add: (listing) => {
      const now = new Date().toISOString()
      const record: ListingRecord = {
        ...listing,
        id: listing.id || crypto.randomUUID(),
        createdAt: listing.createdAt || now,
        updatedAt: listing.updatedAt || now,
      }
      set((state) => ({ items: [record, ...state.items] }))
      return record
    },

    update: (id, changes) => {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item,
        ),
      }))
    },

    remove: (id) => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
    },
  }),
)
