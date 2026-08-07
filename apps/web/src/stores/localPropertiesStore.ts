import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: LocalProperty[] = [
  {
    id: 'prop_001',
    name: 'Zaid Manzil',
    type: 'apartment',
    description: 'A premium apartment complex in the heart of the city.',
    totalUnits: 10,
    occupiedUnits: 2, // fttt + mohan
    listingStatus: 'for-rent',
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    areaSqFt: 1100,
    monthlyRent: 8000,
    amenities: ['Security', 'Lift', 'Power Backup', 'Water 24/7'],
    address: { line1: '43/18, MG Road', city: 'Hyderabad', state: 'Telangana', postalCode: '500001', country: 'IN' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'prop_002',
    name: 'Sai Enclave',
    type: 'apartment',
    description: 'Well-maintained residential complex with 24/7 security.',
    totalUnits: 8,
    occupiedUnits: 1, // ram
    listingStatus: 'for-rent',
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    areaSqFt: 1400,
    monthlyRent: 9000,
    amenities: ['Security', 'CCTV', 'Club House'],
    address: { line1: '43/65, Banjara Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500034', country: 'IN' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'prop_003',
    name: 'Green Valley Homes',
    type: 'house',
    description: 'Independent villa in a serene green locality.',
    totalUnits: 1,
    occupiedUnits: 1, // mohammed
    listingStatus: 'occupied',
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    areaSqFt: 1800,
    monthlyRent: 5000,
    amenities: ['Garden', 'Terrace', 'Security'],
    address: { line1: 'Plot 12, Green Valley', city: 'Secunderabad', state: 'Telangana', postalCode: '500015', country: 'IN' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'prop_004',
    name: 'Sunrise Villa',
    type: 'villa',
    description: 'Luxury independent villa with private garden and premium interiors.',
    totalUnits: 1,
    occupiedUnits: 0,
    listingStatus: 'for-rent',
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    areaSqFt: 3200,
    monthlyRent: 35000,
    amenities: ['Swimming Pool', 'Garden', 'Security', 'Gym', 'Power Backup'],
    address: { line1: '7-8-112, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500033', country: 'IN' },
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'prop_005',
    name: 'Harmony Heights',
    type: 'apartment',
    description: 'Modern apartments with gym and rooftop lounge.',
    totalUnits: 20,
    occupiedUnits: 0,
    listingStatus: 'for-rent',
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    areaSqFt: 950,
    monthlyRent: 12000,
    amenities: ['Gym', 'Rooftop Lounge', 'Lift', 'Visitor Parking'],
    address: { line1: 'Tower A, Kondapur', city: 'Hyderabad', state: 'Telangana', postalCode: '500084', country: 'IN' },
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'prop_006',
    name: 'Skyline Commercial Complex',
    type: 'commercial',
    description: 'Premium ground-floor commercial space in the central business district.',
    totalUnits: 4,
    occupiedUnits: 0,
    listingStatus: 'for-sale',
    areaSqFt: 2400,
    salePrice: 8500000,
    amenities: ['Parking', 'High-Speed Internet', 'Reception', 'Meeting Rooms'],
    address: { line1: 'Plot 5, Hitech City', city: 'Hyderabad', state: 'Telangana', postalCode: '500081', country: 'IN' },
    createdAt: '2026-03-15T00:00:00.000Z',
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface LocalPropertiesState {
  items: LocalProperty[]
  add: (p: Omit<LocalProperty, 'id' | 'createdAt'>) => LocalProperty
  update: (id: string, changes: Partial<Omit<LocalProperty, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
  /** Called when a tenancy is created: occupies units on the property */
  occupyUnits: (propertyId: string, units: number) => void
  /** Called when a tenancy is terminated: frees units */
  freeUnits: (propertyId: string, units: number) => void
  /** Explicitly set the listing status of a property */
  setListingStatus: (propertyId: string, status: LocalPropertyListingStatus) => void
}

export const useLocalPropertiesStore = create<LocalPropertiesState>()(
  persist(
    (set) => ({
      items: SEED,

      add: (p) => {
        const now = new Date().toISOString()
        const record: LocalProperty = { ...p, id: crypto.randomUUID(), createdAt: now }
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
              // When freed, revert to for-rent if it was occupied
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
    { name: 'propertypro-local-properties' },
  ),
)
