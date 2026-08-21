import { create } from 'zustand'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'

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

interface NotificationsState {
  items: NotificationRecord[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  addNotification: (input: {
    userEmail: string
    title: string
    message: string
    type?: NotificationType
    eventType?: string
    relatedEntityId?: string
  }) => Promise<NotificationRecord>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (id: string) => Promise<void>
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true })
    try {
      const { data } = await apiClient.get<ApiEnvelope<NotificationRecord[]>>('/notifications')
      if (data.data) {
        set({ items: data.data, error: null })
      }
    } catch (err: any) {
      set({ error: err })
    } finally {
      set({ isLoading: false })
    }
  },

  markAsRead: async (id) => {
    try {
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
      }))
      await apiClient.patch(`/notifications/${id}/read`)
    } catch (err: any) {
      set({ error: err })
    }
  },

  markAllAsRead: async () => {
    try {
      set((state) => ({
        items: state.items.map((item) => ({ ...item, read: true })),
      }))
      await apiClient.post('/notifications/read-all')
    } catch (err: any) {
      set({ error: err })
    }
  },

  removeNotification: async (id) => {
    try {
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }))
      await apiClient.delete(`/notifications/${id}`)
    } catch (err: any) {
      set({ error: err })
    }
  },

  addNotification: async (input) => {
    try {
      const { data } = await apiClient.post<ApiEnvelope<NotificationRecord>>('/notifications', input)
      if (data.data) {
        const record = data.data
        set((state) => {
          const exists = state.items.some((item) => item.id === record.id)
          return { items: exists ? state.items : [record, ...state.items] }
        })
        return record
      }
    } catch (err: any) {
      set({ error: err })
    }
    const fallback: NotificationRecord = {
      id: `ntf_${Math.random().toString(36).substring(2, 9)}`,
      userEmail: input.userEmail,
      title: input.title,
      message: input.message,
      type: input.type ?? 'info',
      read: false,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ items: [fallback, ...state.items] }))
    return fallback
  },
}))
