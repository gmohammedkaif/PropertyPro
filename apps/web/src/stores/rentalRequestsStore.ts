import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RentalRequestStatus = 'pending' | 'approved' | 'rejected'

export interface RentalRequestRecord {
  id: string
  propertyId: string
  propertyName: string
  propertyType?: string
  ownerId?: string
  ownerEmail?: string
  ownerName?: string
  tenantId?: string
  tenantEmail: string
  fullName: string
  mobileNumber: string
  city: string
  monthlyRent?: number
  status: RentalRequestStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

const SEED: RentalRequestRecord[] = [
  {
    id: 'req_001',
    propertyId: 'prop_004',
    propertyName: 'Sunrise Villa',
    propertyType: 'villa',
    tenantEmail: 'tenant@propertypro.app',
    fullName: 'John Tenant',
    mobileNumber: '9876543210',
    city: 'Hyderabad',
    monthlyRent: 35000,
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

interface RentalRequestsState {
  items: RentalRequestRecord[]
  addRequest: (input: {
    propertyId: string
    propertyName: string
    propertyType?: string
    ownerId?: string
    ownerName?: string
    tenantId?: string
    tenantEmail: string
    fullName: string
    mobileNumber: string
    city: string
    monthlyRent?: number
  }) => RentalRequestRecord
  updateStatus: (id: string, status: RentalRequestStatus, notes?: string) => void
  removeRequest: (id: string) => void
  getRequestsByTenant: (email: string) => RentalRequestRecord[]
}

export const useRentalRequestsStore = create<RentalRequestsState>()(
  persist(
    (set, get) => ({
      items: SEED,

      addRequest: (input) => {
        const now = new Date().toISOString()
        const record: RentalRequestRecord = {
          id: `req_${Math.random().toString(36).substring(2, 9)}`,
          ...input,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ items: [record, ...state.items] }))
        return record
      },

      updateStatus: (id, status, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, status, notes: notes ?? item.notes, updatedAt: new Date().toISOString() }
              : item,
          ),
        }))
      },

      removeRequest: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
      },

      getRequestsByTenant: (email) => {
        return get().items.filter((req) => req.tenantEmail.toLowerCase() === email.toLowerCase())
      },
    }),
    { name: 'propertypro-rental-requests' },
  ),
)
