import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface BookingRecord {
  id: string
  propertyName: string
  visitorName: string
  visitorEmail: string
  visitorPhone?: string
  scheduledDate: string
  scheduledTime: string
  status: BookingStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)
const dayAfter = new Date(today)
dayAfter.setDate(today.getDate() + 2)
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)

const fmt = (d: Date) => d.toISOString().slice(0, 10)

const SEED: BookingRecord[] = [
  {
    id: 'bkg_001',
    propertyName: 'Hassan Villa',
    visitorName: 'Karan Mehta',
    visitorEmail: 'karan.mehta@email.com',
    visitorPhone: '+91 99887 76655',
    scheduledDate: fmt(tomorrow),
    scheduledTime: '10:00',
    status: 'confirmed',
    notes: 'Interested in a 12-month lease. Pre-approved for the rent amount.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bkg_002',
    propertyName: 'Sunrise Heights Studio',
    visitorName: 'Sneha Reddy',
    visitorEmail: 'sneha.reddy@email.com',
    visitorPhone: '+91 88776 65544',
    scheduledDate: fmt(tomorrow),
    scheduledTime: '14:30',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bkg_003',
    propertyName: 'Green Park Residency',
    visitorName: 'Vikram Singh',
    visitorEmail: 'vikram.singh@email.com',
    scheduledDate: fmt(yesterday),
    scheduledTime: '11:00',
    status: 'completed',
    notes: 'Tenant decided to move forward. Lease papers to be prepared.',
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: 'bkg_004',
    propertyName: 'Business District Commercial Unit',
    visitorName: 'TechStartup Pvt Ltd',
    visitorEmail: 'admin@techstartup.in',
    visitorPhone: '+91 22 4455 6677',
    scheduledDate: fmt(dayAfter),
    scheduledTime: '15:00',
    status: 'confirmed',
    notes: 'Corporate client looking for 5-year commercial lease.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bkg_005',
    propertyName: 'Hassan Villa',
    visitorName: 'Anita Desai',
    visitorEmail: 'anita.desai@email.com',
    visitorPhone: '+91 77665 54433',
    scheduledDate: fmt(yesterday),
    scheduledTime: '16:00',
    status: 'cancelled',
    notes: 'Cancelled 2 hours before scheduled time.',
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface BookingsState {
  items: BookingRecord[]
  add: (booking: Omit<BookingRecord, 'id' | 'createdAt' | 'updatedAt'>) => BookingRecord
  update: (id: string, changes: Partial<Omit<BookingRecord, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
}

export const useBookingsStore = create<BookingsState>()(
  persist(
    (set) => ({
      items: SEED,

      add: (booking) => {
        const now = new Date().toISOString()
        const record: BookingRecord = {
          ...booking,
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
    { name: 'propertypro-bookings' },
  ),
)
