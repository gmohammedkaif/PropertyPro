import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TenancyStatus = 'active' | 'expiring-soon' | 'expired' | 'terminated'

export interface TenancyRecord {
  id: string
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  /** ID in localPropertiesStore */
  propertyId: string
  /** Human-readable name (denormalized for display) */
  propertyName: string
  unitNumber?: string
  /** For apartments: number of units this tenant occupies */
  unitsOccupied: number
  leaseStart: string
  leaseEnd: string
  monthlyRent: number
  securityDeposit: number
  status: TenancyStatus
  createdAt: string
  updatedAt: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: TenancyRecord[] = [
  {
    id: 'tnc_001',
    tenantName: 'fttt',
    tenantEmail: 'ft@gmail.com',
    tenantPhone: '9978543215',
    propertyId: 'prop_001',
    propertyName: 'Zaid Manzil',
    unitNumber: '43/18',
    unitsOccupied: 1,
    leaseStart: '2026-05-01',
    leaseEnd: '2027-04-30',
    monthlyRent: 8000,
    securityDeposit: 70000,
    status: 'active',
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'tnc_002',
    tenantName: 'mohan',
    tenantEmail: 'mohan@gmail.com',
    tenantPhone: '9898989898',
    propertyId: 'prop_001',
    propertyName: 'Zaid Manzil',
    unitNumber: '101',
    unitsOccupied: 1,
    leaseStart: '2026-06-01',
    leaseEnd: '2027-05-31',
    monthlyRent: 8000,
    securityDeposit: 200000,
    status: 'active',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'tnc_003',
    tenantName: 'ram',
    tenantEmail: 'ram@gmail.com',
    tenantPhone: '9008989898',
    propertyId: 'prop_002',
    propertyName: 'Sai Enclave',
    unitNumber: '43/65',
    unitsOccupied: 1,
    leaseStart: '2026-01-01',
    leaseEnd: '2026-12-31',
    monthlyRent: 9000,
    securityDeposit: 50000,
    status: 'active',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'tnc_004',
    tenantName: 'mohammed',
    tenantEmail: 'mohammed@gmail.com',
    tenantPhone: '8765456789',
    propertyId: 'prop_003',
    propertyName: 'Green Valley Homes',
    unitNumber: undefined,
    unitsOccupied: 1,
    leaseStart: '2026-05-01',
    leaseEnd: '2027-04-30',
    monthlyRent: 5000,
    securityDeposit: 100000,
    status: 'active',
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface TenanciesState {
  items: TenancyRecord[]
  add: (tenancy: Omit<TenancyRecord, 'id' | 'createdAt' | 'updatedAt'>) => TenancyRecord
  update: (id: string, changes: Partial<Omit<TenancyRecord, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
}

export const useTenanciesStore = create<TenanciesState>()(
  persist(
    (set) => ({
      items: SEED,

      add: (tenancy) => {
        const now = new Date().toISOString()
        const record: TenancyRecord = {
          ...tenancy,
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
    { name: 'propertypro-tenancies' },
  ),
)
