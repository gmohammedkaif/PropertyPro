import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

const SEED: FamilyMemberRecord[] = [
  {
    id: 'fam_001',
    tenantEmail: 'tenant@propertypro.app',
    name: 'Sarah Tenant',
    relationship: 'Spouse',
    age: 29,
    phone: '+91 98765 12345',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fam_002',
    tenantEmail: 'tenant@propertypro.app',
    name: 'Leo Tenant',
    relationship: 'Child',
    age: 4,
    phone: 'N/A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

interface FamilyMembersState {
  items: FamilyMemberRecord[]
  addMember: (input: {
    tenantEmail: string
    name: string
    relationship: FamilyRelationship
    age: number
    phone: string
  }) => FamilyMemberRecord
  updateMember: (id: string, input: Partial<Omit<FamilyMemberRecord, 'id' | 'createdAt'>>) => void
  removeMember: (id: string) => void
  getMembersByTenant: (email: string) => FamilyMemberRecord[]
}

export const useFamilyMembersStore = create<FamilyMembersState>()(
  persist(
    (set, get) => ({
      items: SEED,

      addMember: (input) => {
        const now = new Date().toISOString()
        const record: FamilyMemberRecord = {
          id: `fam_${Math.random().toString(36).substring(2, 9)}`,
          ...input,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ items: [...state.items, record] }))
        return record
      },

      updateMember: (id, input) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item,
          ),
        }))
      },

      removeMember: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
      },

      getMembersByTenant: (email) => {
        return get().items.filter((m) => m.tenantEmail.toLowerCase() === email.toLowerCase())
      },
    }),
    { name: 'propertypro-family-members' },
  ),
)
