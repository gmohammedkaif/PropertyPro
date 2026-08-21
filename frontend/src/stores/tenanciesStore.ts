import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import { useAuthStore } from './authStore'

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
  /** Duration in months (e.g. 6, 12, 18, 24) */
  leaseDurationMonths?: number
  monthlyRent: number
  securityDeposit: number
  leaseNotes?: string
  /** Email of the owner who approved the lease */
  ownerEmail?: string
  ownerName?: string
  /** Original rental request ID that triggered this tenancy */
  requestId?: string
  status: TenancyStatus
  createdAt: string
  updatedAt: string
}

// Seed data not needed for business data store of truth, but initialized empty
const SEED: TenancyRecord[] = []

// ─── Store ────────────────────────────────────────────────────────────────────

interface TenanciesState {
  items: TenancyRecord[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  add: (tenancy: any) => Promise<TenancyRecord>
  update: (id: string, changes: Partial<any>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useTenanciesStore = create<TenanciesState>()(
  (set) => ({
    items: [],
    isLoading: false,
    error: null,

    fetch: async () => {
      set({ isLoading: true })
      try {
        const user = useAuthStore.getState().user
        if (!user) return

        const isTenant = user.roles.includes('tenant') && !user.roles.some((r) => ['owner', 'agent', 'admin'].includes(r))
        
        if (isTenant) {
          try {
            const { data } = await apiClient.get<ApiEnvelope<TenancyRecord>>('/tenancies/my-lease')
            if (data.data) {
              set({ items: [data.data], error: null })
            } else {
              set({ items: [], error: null })
            }
          } catch (err: any) {
            if (err.status === 404) {
              set({ items: [], error: null })
            } else {
              throw err
            }
          }
        } else {
          const { data } = await apiClient.get<ApiEnvelope<TenancyRecord[]>>('/tenancies')
          if (data.data) {
            set({ items: data.data, error: null })
          }
        }
      } catch (err: any) {
        set({ error: err })
      } finally {
        set({ isLoading: false })
      }
    },

    add: async (tenancy) => {
      const { data } = await apiClient.post<ApiEnvelope<TenancyRecord>>('/tenancies', tenancy)
      if (data.error || !data.data) throw new Error(data.error?.message || 'Failed to create tenancy')
      const record = data.data
      set((state) => ({ items: [record, ...state.items] }))
      return record
    },

    update: async (id, changes) => {
      const { data } = await apiClient.patch<ApiEnvelope<TenancyRecord>>(`/tenancies/${id}`, changes)
      if (data.error || !data.data) throw new Error(data.error?.message || 'Failed to update tenancy')
      const record = data.data
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? record : item)),
      }))
    },

    remove: async (id) => {
      const { data } = await apiClient.delete<ApiEnvelope<any>>(`/tenancies/${id}`)
      if (data.error) throw new Error(data.error.message)
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
    },
  }),
)
