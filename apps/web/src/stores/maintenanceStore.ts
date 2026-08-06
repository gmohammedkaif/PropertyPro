import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'
export type MaintenanceStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

export interface MaintenanceRecord {
  id: string
  title: string
  description?: string
  propertyName: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  reportedBy?: string
  assignedTo?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: MaintenanceRecord[] = [
  {
    id: 'mnt_001',
    title: 'AC Unit Not Cooling',
    description:
      'The central air conditioning unit in the master bedroom stopped cooling. Tenant reports warm air blowing out.',
    propertyName: 'Hassan Villa',
    priority: 'urgent',
    status: 'open',
    reportedBy: 'Rajesh Kumar',
    createdAt: '2026-08-04T10:00:00.000Z',
    updatedAt: '2026-08-04T10:00:00.000Z',
  },
  {
    id: 'mnt_002',
    title: 'Leaking Kitchen Faucet',
    description: 'Kitchen tap is dripping continuously. Tenant estimates ~5L water waste per day.',
    propertyName: 'Green Park Residency',
    priority: 'medium',
    status: 'in-progress',
    reportedBy: 'Priya Sharma',
    assignedTo: 'Ravi Plumbing Services',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
  },
  {
    id: 'mnt_003',
    title: 'Exterior Paint Touch-up',
    description: 'Paint peeling on the south-facing exterior wall. Needs repainting before monsoon.',
    propertyName: 'Sunrise Heights Studio',
    priority: 'low',
    status: 'resolved',
    reportedBy: 'Building Inspector',
    assignedTo: 'ColorPro Painters',
    resolvedAt: '2026-07-28T10:00:00.000Z',
    createdAt: '2026-07-15T10:00:00.000Z',
    updatedAt: '2026-07-28T10:00:00.000Z',
  },
  {
    id: 'mnt_004',
    title: 'Main Gate Motor Failure',
    description:
      'Automated gate motor is not responding. Manual override is being used as a temporary fix.',
    propertyName: 'Hassan Villa',
    priority: 'high',
    status: 'open',
    reportedBy: 'Security Guard',
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
  },
  {
    id: 'mnt_005',
    title: 'Internet Router Replacement',
    description: 'Common area WiFi router has failed. Tenants require connectivity.',
    propertyName: 'Green Park Residency',
    priority: 'medium',
    status: 'closed',
    reportedBy: 'Arjun Nair',
    assignedTo: 'TechFix Solutions',
    resolvedAt: '2026-07-20T10:00:00.000Z',
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

interface MaintenanceState {
  items: MaintenanceRecord[]
  add: (item: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => MaintenanceRecord
  update: (id: string, changes: Partial<Omit<MaintenanceRecord, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
}

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    (set) => ({
      items: SEED,

      add: (item) => {
        const now = new Date().toISOString()
        const record: MaintenanceRecord = {
          ...item,
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
    { name: 'propertypro-maintenance' },
  ),
)
