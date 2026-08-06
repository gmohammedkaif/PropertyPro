import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocalPropertyType = 'apartment' | 'house' | 'villa' | 'commercial' | 'mixed'

export interface LocalProperty {
  id: string
  name: string
  type: LocalPropertyType
  description?: string
  /** Total units (apartments). House/Villa = 1 */
  totalUnits: number
  /** How many units are currently occupied by tenants */
  occupiedUnits: number
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
    address: { line1: 'Plot 12, Green Valley', city: 'Secunderabad', state: 'Telangana', postalCode: '500015', country: 'IN' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'prop_004',
    name: 'Sunrise Villa',
    type: 'villa',
    description: 'Luxury independent villa with private garden.',
    totalUnits: 1,
    occupiedUnits: 0,
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
    address: { line1: 'Tower A, Kondapur', city: 'Hyderabad', state: 'Telangana', postalCode: '500084', country: 'IN' },
    createdAt: '2026-03-01T00:00:00.000Z',
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
          items: state.items.map((item) =>
            item.id === propertyId
              ? { ...item, occupiedUnits: Math.min(item.totalUnits, item.occupiedUnits + units) }
              : item,
          ),
        }))
      },

      freeUnits: (propertyId, units) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === propertyId
              ? { ...item, occupiedUnits: Math.max(0, item.occupiedUnits - units) }
              : item,
          ),
        }))
      },
    }),
    { name: 'propertypro-local-properties' },
  ),
)
