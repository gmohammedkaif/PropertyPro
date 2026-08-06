import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial'
export type PaymentType = 'rent' | 'deposit' | 'maintenance' | 'other'

export interface PaymentRecord {
  id: string
  tenantName: string
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

const SEED: PaymentRecord[] = [
  {
    id: 'pay_001',
    tenantName: 'fttt',
    propertyName: 'Zaid Manzil',
    amount: 8000,
    dueDate: '2026-08-01',
    paidDate: '2026-07-31',
    status: 'paid',
    type: 'rent',
    createdAt: '2026-07-31T09:00:00.000Z',
    updatedAt: '2026-07-31T09:00:00.000Z',
  },
  {
    id: 'pay_002',
    tenantName: 'mohan',
    propertyName: 'Zaid Manzil',
    amount: 8000,
    dueDate: '2026-08-05',
    paidDate: '2026-08-04',
    status: 'paid',
    type: 'rent',
    createdAt: '2026-08-04T09:00:00.000Z',
    updatedAt: '2026-08-04T09:00:00.000Z',
  },
  {
    id: 'pay_003',
    tenantName: 'ram',
    propertyName: 'Sai Enclave',
    amount: 9000,
    dueDate: '2026-07-01',
    paidDate: '2026-07-01',
    status: 'paid',
    type: 'rent',
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'pay_004',
    tenantName: 'mohammed',
    propertyName: 'Green Valley Homes',
    amount: 5000,
    dueDate: '2026-07-05',
    status: 'pending',
    type: 'rent',
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-01T09:00:00.000Z',
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface PaymentsState {
  items: PaymentRecord[]
  add: (payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>) => PaymentRecord
  update: (id: string, changes: Partial<Omit<PaymentRecord, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
}

export const usePaymentsStore = create<PaymentsState>()(
  persist(
    (set) => ({
      items: SEED,

      add: (payment) => {
        const now = new Date().toISOString()
        const record: PaymentRecord = {
          ...payment,
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
    { name: 'propertypro-payments' },
  ),
)
