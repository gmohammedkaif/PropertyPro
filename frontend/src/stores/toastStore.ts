import { create } from 'zustand'

export type ToastIntent = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  intent: ToastIntent
  title: string
  description?: string
  duration: number
  /** Optional callback to invoke when the user clicks the action label. */
  action?: { label: string; onClick: () => void }
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
}

let _counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++_counter}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }].slice(-5), // cap at 5 visible
    }))
    return id
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
