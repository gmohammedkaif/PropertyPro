import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import { useAuthStore } from './authStore'

export type FamilyRelationship = 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other'

export interface FamilyMemberRecord {
  id: string
  tenantEmail: string
  name: string
  relationship: FamilyRelationship
  age: number
  phone: string
  createdAt: string
  updatedAt: string
}

interface FamilyMembersState {
  items: FamilyMemberRecord[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  addMember: (input: {
    tenantEmail: string
    name: string
    relationship: FamilyRelationship
    age: number
    phone: string
  }) => Promise<FamilyMemberRecord>
  updateMember: (id: string, input: Partial<Omit<FamilyMemberRecord, 'id' | 'createdAt'>>) => Promise<void>
  removeMember: (id: string) => Promise<void>
  getMembersByTenant: (email: string) => FamilyMemberRecord[]
}

export const useFamilyMembersStore = create<FamilyMembersState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true })
    try {
      const user = useAuthStore.getState().user
      if (!user) return
      const { data } = await apiClient.get<ApiEnvelope<FamilyMemberRecord[]>>('/auth/family')
      if (data.data) {
        set({ items: data.data, error: null })
      }
    } catch (err: any) {
      set({ error: err })
    } finally {
      set({ isLoading: false })
    }
  },

  addMember: async (input) => {
    set({ isLoading: true })
    try {
      const user = useAuthStore.getState().user
      const now = new Date().toISOString()
      const newMember: FamilyMemberRecord = {
        id: `fam_${Math.random().toString(36).substring(2, 9)}`,
        tenantEmail: input.tenantEmail || user?.email || '',
        name: input.name,
        relationship: input.relationship,
        age: input.age,
        phone: input.phone,
        createdAt: now,
        updatedAt: now,
      }

      const nextItems = [...get().items, newMember]
      const { data } = await apiClient.put<ApiEnvelope<FamilyMemberRecord[]>>('/auth/family', {
        familyMembers: nextItems,
      })
      
      const updated = data.data || nextItems
      set({ items: updated, error: null })
      return newMember
    } catch (err: any) {
      set({ error: err })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  updateMember: async (id, input) => {
    set({ isLoading: true })
    try {
      const nextItems = get().items.map((item) =>
        item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item,
      )
      const { data } = await apiClient.put<ApiEnvelope<FamilyMemberRecord[]>>('/auth/family', {
        familyMembers: nextItems,
      })
      const updated = data.data || nextItems
      set({ items: updated, error: null })
    } catch (err: any) {
      set({ error: err })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  removeMember: async (id) => {
    set({ isLoading: true })
    try {
      const nextItems = get().items.filter((item) => item.id !== id)
      const { data } = await apiClient.put<ApiEnvelope<FamilyMemberRecord[]>>('/auth/family', {
        familyMembers: nextItems,
      })
      const updated = data.data || nextItems
      set({ items: updated, error: null })
    } catch (err: any) {
      set({ error: err })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  getMembersByTenant: (email) => {
    return get().items.filter((m) => m.tenantEmail.toLowerCase() === email.toLowerCase())
  },
}))
