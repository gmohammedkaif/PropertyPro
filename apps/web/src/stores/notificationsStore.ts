import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = 'info' | 'success' | 'warning' | 'danger'

export interface NotificationRecord {
  id: string
  userEmail: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
}

const SEED: NotificationRecord[] = [
  {
    id: 'ntf_001',
    userEmail: 'tenant@propertypro.app',
    title: 'Welcome to PropertyPro!',
    message: 'Browse top available properties and submit rental requests directly to house owners.',
    type: 'info',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ntf_002',
    userEmail: 'tenant@propertypro.app',
    title: 'Rental Request Pending',
    message: 'Your rental request for Sunrise Villa has been sent to the property owner.',
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

interface NotificationsState {
  items: NotificationRecord[]
  addNotification: (input: {
    userEmail: string
    title: string
    message: string
    type?: NotificationType
  }) => NotificationRecord
  markAsRead: (id: string) => void
  markAllAsRead: (userEmail: string) => void
  removeNotification: (id: string) => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: SEED,

      addNotification: (input) => {
        const record: NotificationRecord = {
          id: `ntf_${Math.random().toString(36).substring(2, 9)}`,
          userEmail: input.userEmail,
          title: input.title,
          message: input.message,
          type: input.type ?? 'info',
          read: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ items: [record, ...state.items] }))
        return record
      },

      markAsRead: (id) => {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
        }))
      },

      markAllAsRead: (userEmail) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.userEmail.toLowerCase() === userEmail.toLowerCase() ? { ...item, read: true } : item,
          ),
        }))
      },

      removeNotification: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
      },
    }),
    { name: 'propertypro-notifications' },
  ),
)
