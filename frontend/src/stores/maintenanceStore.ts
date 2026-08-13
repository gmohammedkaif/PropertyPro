import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import { useLocalPropertiesStore } from './localPropertiesStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'
export type MaintenanceStatus = 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed' | 'rejected'

export interface MaintenanceRecord {
  id: string
  title: string
  description?: string
  propertyName: string
  propertyId?: string
  /** Issue category (e.g. Electrical, Water, Cleaning) */
  category?: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  reportedBy?: string
  /** Email of the tenant who reported — used to send status update notifications */
  tenantEmail?: string
  assignedTo?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

// Seed data not needed for business data store of truth, but initialized empty
const SEED: MaintenanceRecord[] = []

// ─── Store ────────────────────────────────────────────────────────────────────

interface MaintenanceState {
  items: MaintenanceRecord[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  add: (item: any) => Promise<MaintenanceRecord>
  update: (id: string, changes: Partial<any>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useMaintenanceStore = create<MaintenanceState>()((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.get<ApiEnvelope<MaintenanceRecord[]>>('/maintenance')
      if (data.data) {
        set({ items: data.data, error: null })
      }
    } catch (err: any) {
      set({ error: err })
    } finally {
      set({ isLoading: false })
    }
  },

  add: async (item) => {
    set({ isLoading: true })
    try {
      const properties = useLocalPropertiesStore.getState().items
      const matchedProp = properties.find(
        (p) => p.name.toLowerCase() === item.propertyName.toLowerCase()
      )
      
      const payload = {
        title: item.title,
        description: item.description,
        propertyId: item.propertyId || matchedProp?.id || item.propertyName,
        category: item.category,
        priority: item.priority,
        status: item.status,
      }

      const { data } = await apiClient.post<ApiEnvelope<MaintenanceRecord>>('/maintenance', payload)
      if (!data.data) throw new Error(data.error?.message || 'Failed to submit maintenance ticket')
      
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

  update: async (id, changes) => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.patch<ApiEnvelope<MaintenanceRecord>>(`/maintenance/${id}`, changes)
      if (data.error) throw new Error(data.error.message)
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
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
      const { data } = await apiClient.delete<ApiEnvelope<any>>(`/maintenance/${id}`)
      if (data.error) throw new Error(data.error.message)
      set((state) => ({ items: state.items.filter((item) => item.id !== id), error: null }))
    } catch (err: any) {
      set({ error: err })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },
}))
