import { create } from 'zustand'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  resolveRef: { current: ((value: boolean) => void) | null }
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
  confirm: () => void
  cancel: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => {
  const resolveRef = { current: null as ((value: boolean) => void) | null }

  return {
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    resolveRef,

    showConfirm: ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) => {
      set({ isOpen: true, title, message, confirmLabel, cancelLabel })
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve
      })
    },

    confirm: () => {
      const { resolveRef } = get()
      if (resolveRef.current) resolveRef.current(true)
      set({ isOpen: false })
    },

    cancel: () => {
      const { resolveRef } = get()
      if (resolveRef.current) resolveRef.current(false)
      set({ isOpen: false })
    },
  }
})
