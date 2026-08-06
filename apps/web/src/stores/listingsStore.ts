import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: ListingRecord[] = [
  {
    id: 'lst_001',
    propertyName: 'Hassan Villa',
    type: 'rent',
    status: 'available',
    price: 45000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqFt: 1800,
    description: 'Spacious 3BHK villa with premium fixtures and modern amenities.',
    createdAt: '2026-07-15T10:00:00.000Z',
    updatedAt: '2026-07-15T10:00:00.000Z',
  },
  {
    id: 'lst_002',
    propertyName: 'Green Park Residency',
    type: 'rent',
    status: 'rented',
    price: 28000,
    bedrooms: 2,
    bathrooms: 1,
    areaSqFt: 1100,
    description: 'Cozy 2BHK in a prime residential locality with great connectivity.',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'lst_003',
    propertyName: 'Sunrise Heights Studio',
    type: 'rent',
    status: 'available',
    price: 18000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 650,
    description: 'Modern studio apartment with city views and high-speed internet.',
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
  },
  {
    id: 'lst_004',
    propertyName: 'Business District Commercial Unit',
    type: 'sale',
    status: 'under-offer',
    price: 8500000,
    areaSqFt: 2400,
    description: 'Premium ground-floor commercial space in the central business district.',
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface ListingsState {
  items: ListingRecord[]
  add: (listing: Omit<ListingRecord, 'id' | 'createdAt' | 'updatedAt'>) => ListingRecord
  update: (id: string, changes: Partial<Omit<ListingRecord, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
}

export const useListingsStore = create<ListingsState>()(
  persist(
    (set) => ({
      items: SEED,

      add: (listing) => {
        const now = new Date().toISOString()
        const record: ListingRecord = {
          ...listing,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
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
    { name: 'propertypro-listings' },
  ),
)
