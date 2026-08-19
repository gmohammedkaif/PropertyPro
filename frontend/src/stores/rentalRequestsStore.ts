import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'

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

interface RentalRequestsState {
  items: RentalRequestRecord[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  addRequest: (input: {
    propertyId: string
    propertyName: string
    propertyType?: string
    fullName: string
    mobileNumber: string
    city: string
    monthlyRent?: number
    notes?: string
  }) => Promise<RentalRequestRecord>
  approveRequest: (id: string, leaseDetails: {
    leaseStart: string
    leaseDurationMonths: number
    monthlyRent: number
    securityDeposit: number
    unitNumber?: string
    leaseNotes?: string
  }) => Promise<void>
  rejectRequest: (id: string) => Promise<void>
  updateStatus: (id: string, status: RentalRequestStatus, notes?: string) => void
  removeRequest: (id: string) => void
  getRequestsByTenant: (email: string) => RentalRequestRecord[]
}

export const useRentalRequestsStore = create<RentalRequestsState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.get<ApiEnvelope<RentalRequestRecord[]>>('/rental-requests')
      if (data.data) {
        set({ items: data.data, error: null })
      }
    } catch (err: any) {
      set({ error: err })
    } finally {
      set({ isLoading: false })
    }
  },

  addRequest: async (input) => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.post<ApiEnvelope<RentalRequestRecord>>('/rental-requests', input)
      if (!data.data) throw new Error(data.error?.message || 'Failed to submit request')
      const created = data.data
      set((state) => ({ items: [created, ...state.items], error: null }))
      return created
    } catch (err: any) {
      set({ error: err })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  approveRequest: async (id, leaseDetails) => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.post<ApiEnvelope<any>>(`/rental-requests/${id}/approve`, leaseDetails)
      if (data.error) throw new Error(data.error.message)
      // Update request status locally to approved
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, status: 'approved', updatedAt: new Date().toISOString() } : item
        ),
        error: null,
      }))
    } catch (err: any) {
      set({ error: err })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  rejectRequest: async (id) => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.post<ApiEnvelope<any>>(`/rental-requests/${id}/reject`, {})
      if (data.error) throw new Error(data.error.message)
      // Update request status locally to rejected
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, status: 'rejected', updatedAt: new Date().toISOString() } : item
        ),
        error: null,
      }))
    } catch (err: any) {
      set({ error: err })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  updateStatus: (id, status, notes) => {
    // Kept for backward compatibility
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, status, notes: notes ?? item.notes, updatedAt: new Date().toISOString() }
          : item
      ),
    }))
  },

  removeRequest: (id) => {
    // Kept for backward compatibility
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
  },

  getRequestsByTenant: (email) => {
    return get().items.filter((req) => req.tenantEmail.toLowerCase() === email.toLowerCase())
  },
}))
