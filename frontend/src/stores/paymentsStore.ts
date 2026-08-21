import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import { useAuthStore } from './authStore'
import { useLocalPropertiesStore } from './localPropertiesStore'
import { useTenanciesStore } from './tenanciesStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial'
export type PaymentType = 'rent' | 'deposit' | 'maintenance' | 'other'

export interface PaymentRecord {
  id: string
  tenantName: string
  tenantEmail?: string
  propertyName: string
  amount: number
  dueDate: string
  paidDate?: string
  status: PaymentStatus
  type: PaymentType
  notes?: string
  createdAt: string
  updatedAt: string
}

// Seed data not needed for business data store of truth, but initialized empty
const SEED: PaymentRecord[] = []

// ─── Store ────────────────────────────────────────────────────────────────────

interface PaymentsState {
  items: PaymentRecord[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  add: (payment: {
    tenantName: string
    propertyName: string
    amount: number
    dueDate: string
    type: PaymentType
    notes?: string
  }) => Promise<PaymentRecord>
  processPayment: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  update: (id: string, changes: Partial<any>) => void // Kept for interface compatibility
}

export const usePaymentsStore = create<PaymentsState>()((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true })
    try {
      const user = useAuthStore.getState().user
      if (!user) return

      const isTenant = user.roles.includes('tenant') && !user.roles.some((r) => ['owner', 'agent', 'admin'].includes(r))
      const endpoint = isTenant ? '/payments/my-payments' : '/payments'
      const { data } = await apiClient.get<ApiEnvelope<PaymentRecord[]>>(endpoint)
      if (data.data) {
        set({ items: data.data, error: null })
      }
    } catch (err: any) {
      set({ error: err })
    } finally {
      set({ isLoading: false })
    }
  },

  add: async (payment) => {
    set({ isLoading: true })
    try {
      const properties = useLocalPropertiesStore.getState().items
      const matchedProp = properties.find(
        (p) => p.name.toLowerCase() === payment.propertyName.toLowerCase()
      )
      const tenancies = useTenanciesStore.getState().items
      const matchedTenancy = tenancies.find(
        (t) => t.tenantName.toLowerCase() === payment.tenantName.toLowerCase()
      )
      
      const payload = {
        propertyId: matchedProp?.id || payment.propertyName,
        amount: payment.amount,
        dueDate: payment.dueDate,
        type: payment.type,
        tenantEmail: matchedTenancy?.tenantEmail || '',
        notes: payment.notes,
      }

      const { data } = await apiClient.post<ApiEnvelope<PaymentRecord>>('/payments', payload)
      if (!data.data) throw new Error(data.error?.message || 'Failed to create invoice')
      
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

  processPayment: async (id) => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.post<ApiEnvelope<any>>(`/payments/${id}/pay`, {})
      if (data.error) throw new Error(data.error.message)
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, status: 'paid', paidDate: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString() } : item
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

  remove: async (id) => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.delete<ApiEnvelope<any>>(`/payments/${id}`)
      if (data.error) throw new Error(data.error.message)
      set((state) => ({ items: state.items.filter((item) => item.id !== id), error: null }))
    } catch (err: any) {
      set({ error: err })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  update: (id, changes) => {
    // Kept for backward compatibility
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item
      ),
    }))
  },
}))
